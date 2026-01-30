using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.NetworkInformation;
using System.Web.Script.Services;
using System.Web.Services;
using Qube.DAL;
using Qube.Thrift;
using QubeCinema.Boys;
using QubeCinema.Usher;
using QubeStore;
using Resources;

namespace Qube.Mama;

[WebService(Namespace = "http://webservices.qubecinema.com/XP/Setup/2009-01-14/")]
[ScriptService]
[WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
public class Setup : WebService
{
	private string _GetKeyByProjectorOrder(int projectorOrder)
	{
		return projectorOrder switch
		{
			0 => ConfigKeys.Projector1, 
			1 => ConfigKeys.Projector2, 
			_ => string.Empty, 
		};
	}

	private bool _SaveProjectors(ProjectorInfo[] projectors, PlayerClient client)
	{
		if (projectors.Length == 0)
		{
			return true;
		}
		Dictionary<string, string> dictionary = _GetProjectorConfigsToSave(projectors);
		dictionary.Add(ConfigKeys.SignalFormat, ((int)projectors[0].SignalFormat).ToString());
		_SetConfigs(dictionary);
		dictionary.Remove(ConfigKeys.SignalFormat);
		List<Qube.Thrift.Config> list = _GetConfigs(dictionary.Keys.ToList());
		return !list.Exists((Qube.Thrift.Config projectorConfig) => string.IsNullOrEmpty(projectorConfig.Value));
	}

	private Dictionary<string, string> _GetProjectorConfigsToSave(ProjectorInfo[] projectors)
	{
		Dictionary<string, string> dictionary = new Dictionary<string, string>();
		foreach (ProjectorInfo projectorInfo in projectors)
		{
			if (!string.IsNullOrEmpty(projectorInfo.DLPCinemaProjectorIP))
			{
				dictionary.Add(_GetKeyByProjectorOrder(projectorInfo.ProjectorOrder), projectorInfo.DLPCinemaProjectorIP);
			}
		}
		List<Qube.Thrift.Config> list = _GetConfigs(dictionary.Keys.ToList());
		foreach (Qube.Thrift.Config item in list)
		{
			if (item.Value == dictionary[item.Key])
			{
				dictionary.Remove(item.Key);
			}
		}
		return dictionary;
	}

	private ulong _GetTotalSizeInBytes(string path)
	{
		try
		{
			DriveInfo driveInfo = new DriveInfo(Directory.GetDirectoryRoot(path));
			return (ulong)driveInfo.TotalSize;
		}
		catch (ArgumentException)
		{
			return 900000000uL;
		}
	}

	private ulong _ValidateQuota(string path, ulong quotaSizeInBytes)
	{
		ulong num = _GetTotalSizeInBytes(path);
		if (quotaSizeInBytes > num)
		{
			return num;
		}
		if (quotaSizeInBytes == 0)
		{
			return num * 90 / 100;
		}
		return quotaSizeInBytes;
	}

	private bool _IsMediaFolderExist(DBConnection conxn, string path, string id)
	{
		DB dB = new DB();
		SqlHelper.FillDataset(conxn, CommandType.Text, "select * from MediaFolders", dB, new string[1] { ((DataTable)(object)dB.MediaFolders).TableName });
		path = path.ToLower().Trim(' ', '\\');
		for (int i = 0; i < dB.MediaFolders.Count; i++)
		{
			string path2 = dB.MediaFolders[i].Path.ToLower().Trim(' ', '\\');
			DirectoryInfo directoryInfo = new DirectoryInfo(path);
			DirectoryInfo directoryInfo2 = new DirectoryInfo(path2);
			if (id != dB.MediaFolders[i].Id.ToString() && directoryInfo2.FullName.ToLower() == directoryInfo.FullName.ToLower())
			{
				Diagnostics.LogDebug($"MediaFolder with the path {path} already exists");
				return true;
			}
		}
		return false;
	}

	private bool _Save(DBConnection conxn, string id, string path, ulong quotaInBytes, int cost)
	{
		string currentMediaFolderPath = string.Empty;
		decimal num = Qube.DAL.MediaFolder.ConvertToMB(quotaInBytes);
		MediaFolder mediaFolder;
		if (id != null)
		{
			Guid guid = new Guid(id);
			currentMediaFolderPath = Qube.DAL.MediaFolder.GetMediaFolder(conxn, guid).Path;
			mediaFolder = new MediaFolder(guid);
			ulong usedSpace = Qube.DAL.MediaFolder.GetUsedSpace(conxn, mediaFolder);
			if (quotaInBytes < usedSpace)
			{
				decimal num2 = Qube.DAL.MediaFolder.ConvertToMB(usedSpace);
				string text = string.Format(Resources.Common.mediaFolderUsedSpaceLargerThanSpecifiedQuota, num, num2);
				Diagnostics.LogError(string.Format(ResourceManager.GetString("mediaFolderUsedSpaceLargerThanSpecifiedQuota"), num, num2));
				throw new SoapException(text, Win32ErrorCode.ErrorInvalidQuotaLower, text, base.Context, "Setup");
			}
			TitleType titleType = Qube.DAL.TitleType.GetTitleType(conxn, "advertisement");
			int quota = titleType.Quota;
			if (quota != -1)
			{
				ulong num3 = (ulong)((long)quotaInBytes * (long)quota) / 100uL;
				ulong usedSpaceByTitleType = Qube.DAL.MediaFolder.GetUsedSpaceByTitleType(conxn, titleType, mediaFolder);
				if (num3 < usedSpaceByTitleType)
				{
					Diagnostics.LogError($"The specified quota cannot be saved, as the \r\n                                newly calculated quota for advertisements type({Qube.DAL.MediaFolder.ConvertToMB(num3):0.####} MB) is \r\n                                less than the total space({Qube.DAL.MediaFolder.ConvertToMB(usedSpaceByTitleType):0.####} MB) used by it");
					throw new SoapException(Resources.Common.adsSpaceLessThanUsedSpace, Win32ErrorCode.ErrorInvalidQuotaLower, Resources.Common.adsSpaceLessThanUsedSpace, base.Context, "Setup");
				}
				if (quotaInBytes - usedSpace < num3 - usedSpaceByTitleType)
				{
					Diagnostics.LogError($"The specified quota cannot be saved, as the \r\n                                newly calculated quota cannot allocate advertisements \r\n                                type quota({Qube.DAL.MediaFolder.ConvertToMB(num3):0.####} MB)");
					throw new SoapException(Resources.Common.adsSpaceLessThanUsedSpace, Win32ErrorCode.ErrorInvalidQuotaLower, Resources.Common.adsSpaceLessThanUsedSpace, base.Context, "Setup");
				}
			}
			mediaFolder.Quota = (ulong)num;
		}
		else
		{
			mediaFolder = new MediaFolder();
			mediaFolder.Quota = (ulong)num;
		}
		DirectoryInfo directoryInfo = new DirectoryInfo(path);
		mediaFolder.Path = directoryInfo.FullName.ToLower();
		mediaFolder.Cost = cost;
		directoryInfo = null;
		try
		{
			conxn.BeginTran();
			Qube.DAL.MediaFolder.Save(conxn, mediaFolder);
			_CreateQubeStore(mediaFolder.Path);
			_SaveQubeStore(mediaFolder, currentMediaFolderPath);
			conxn.Commit();
			Diagnostics.LogInfo("Media folder( " + mediaFolder.Path + " ) is saved");
			return true;
		}
		catch (Exception ex)
		{
			conxn.RollBack();
			Diagnostics.LogError(ex.ToString());
			throw;
		}
	}

	private void _SaveQubeStore(MediaFolder mediaFolder, string currentMediaFolderPath)
	{
		IUsherManager usherManager = Utils.GetUsherManager();
		if (usherManager == null)
		{
			throw SoapException.UsherNotFoundException("Setup");
		}
		IManager manager = usherManager.GetService(typeof(IManager)) as IManager;
		try
		{
			long quota = (long)Qube.DAL.MediaFolder.ConvertToBytes(mediaFolder.Quota);
			if (currentMediaFolderPath == string.Empty)
			{
				manager.AddQubeStore(mediaFolder.Path, quota);
			}
			else
			{
				manager.ModifyQubeStore(currentMediaFolderPath, mediaFolder.Path, quota);
			}
		}
		catch (StoreAlreadyExistsException)
		{
		}
	}

	private void _CreateQubeStore(string mediaFolderPath)
	{
		string qubeStorePath = QubeStoreFolder.GetQubeStorePath(mediaFolderPath);
		if (!Directory.Exists(qubeStorePath))
		{
			Directory.CreateDirectory(qubeStorePath);
		}
		_CreateDirectory(mediaFolderPath, QubeStoreFolders.Assets);
		_CreateDirectory(mediaFolderPath, QubeStoreFolders.Keys);
		_CreateDirectory(mediaFolderPath, QubeStoreFolders.Packages);
		_CreateDirectory(mediaFolderPath, QubeStoreFolders.Shows);
		_CreateDirectory(mediaFolderPath, QubeStoreFolders.Scratch);
	}

	private void _DeleteQubeStore(MediaFolder mediaFolder)
	{
		IUsherManager usherManager = Utils.GetUsherManager();
		if (usherManager == null)
		{
			throw SoapException.UsherNotFoundException("Setup");
		}
		IManager manager = usherManager.GetService(typeof(IManager)) as IManager;
		try
		{
			manager.Delete(mediaFolder.Path);
		}
		catch (StoreNotExistsException ex)
		{
			Diagnostics.LogError($"Error while deleting Qube Store '{mediaFolder.Path}'. \n{ex.ToString()}");
		}
	}

	private void _DeleteQubeStore(string mediaFolderPath)
	{
		try
		{
			_DeleteDirectory(mediaFolderPath, QubeStoreFolders.Assets);
			_DeleteDirectory(mediaFolderPath, QubeStoreFolders.Keys);
			_DeleteDirectory(mediaFolderPath, QubeStoreFolders.Packages);
			_DeleteDirectory(mediaFolderPath, QubeStoreFolders.Shows);
			_DeleteDirectory(mediaFolderPath, QubeStoreFolders.Scratch);
			string qubeStorePath = QubeStoreFolder.GetQubeStorePath(mediaFolderPath);
			if (_IsDirectoryEmpty(qubeStorePath))
			{
				Directory.Delete(qubeStorePath);
			}
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
		}
	}

	private void _DeleteDirectory(string mediaFolderPath, QubeStoreFolders qubeStoreFolder)
	{
		string path = QubeStoreFolder.GetPath(mediaFolderPath, qubeStoreFolder);
		if (_IsDirectoryEmpty(path))
		{
			Directory.Delete(path);
		}
	}

	private bool _IsDirectoryEmpty(string path)
	{
		if (Directory.Exists(path) && Directory.GetFiles(path).Length == 0 && Directory.GetDirectories(path).Length == 0)
		{
			return true;
		}
		return false;
	}

	private void _CreateDirectory(string mediaFolderPath, QubeStoreFolders qubeStoreFolder)
	{
		string path = QubeStoreFolder.GetPath(mediaFolderPath, qubeStoreFolder);
		if (!Directory.Exists(path))
		{
			Directory.CreateDirectory(path);
		}
	}

	private PlayerClient _GetPlayerClient()
	{
		PlayerClient playerClient = Utils.GetPlayerClient();
		if (playerClient == null)
		{
			throw new SoapException(Resources.Common.dalapathiNotFound, new InvalidOperationException(Resources.Common.dalapathiNotFound), base.Context, "Setup");
		}
		return playerClient;
	}

	private void _SetConfigs(Dictionary<string, string> keyValuePairs)
	{
		List<Qube.Thrift.Config> list = new List<Qube.Thrift.Config>();
		foreach (KeyValuePair<string, string> keyValuePair in keyValuePairs)
		{
			Qube.Thrift.Config config = new Qube.Thrift.Config();
			config.Key = keyValuePair.Key;
			config.Value = keyValuePair.Value;
			Qube.Thrift.Config item = config;
			list.Add(item);
		}
		using PlayerClient playerClient = _GetPlayerClient();
		playerClient.Player.SetConfigs(list);
	}

	private List<Qube.Thrift.Config> _GetConfigs(List<string> configKeys)
	{
		using PlayerClient playerClient = _GetPlayerClient();
		return playerClient.Player.GetConfigs(configKeys);
	}

	private List<string> _GetDeviceConfigs()
	{
		List<string> list = new List<string>();
		list.Add(ConfigKeys.AutoDelete);
		list.Add(ConfigKeys.AllowPlaybackWithErrors);
		list.Add(ConfigKeys.BufferLevel);
		return list;
	}

	private List<string> _GetDBoxDeviceConfigs()
	{
		List<string> list = new List<string>();
		list.Add(ConfigKeys.AudioOffset);
		list.Add(ConfigKeys.AudioOutput);
		list.Add(ConfigKeys.PsF);
		list.Add(ConfigKeys.SignalFormat);
		list.Add(ConfigKeys.Projector1);
		list.Add(ConfigKeys.Projector2);
		list.Add(ConfigKeys.SampleRateConverterMode);
		List<string> list2 = list;
		list2.AddRange(_GetDeviceConfigs());
		return list2;
	}

	private Qube.Thrift.Config _GetConfig(List<Qube.Thrift.Config> configs, string key)
	{
		return configs.SingleOrDefault((Qube.Thrift.Config config) => config.Key == key);
	}

	private List<ProjectorInfo> _GetProjectorsInfo(DBConnection conxn, List<Qube.Thrift.Config> configs)
	{
		SignalFormat signalFormat = (SignalFormat)Convert.ToInt32(_GetConfig(configs, ConfigKeys.SignalFormat).Value);
		List<ProjectorInfo> list = new List<ProjectorInfo>();
		Qube.Thrift.Config config = _GetConfig(configs, ConfigKeys.Projector1);
		string value = Qube.DAL.Config.GetValue(conxn, ConfigKeys.Projector1);
		if (!string.IsNullOrEmpty(value))
		{
			list.Add(new ProjectorInfo
			{
				DLPCinemaProjectorIP = value,
				ProjectorOrder = 0,
				SignalFormat = signalFormat,
				IsConnected = (config != null && !string.IsNullOrEmpty(config.Value))
			});
		}
		Qube.Thrift.Config config2 = _GetConfig(configs, ConfigKeys.Projector2);
		string value2 = Qube.DAL.Config.GetValue(conxn, ConfigKeys.Projector2);
		if (!string.IsNullOrEmpty(value2))
		{
			list.Add(new ProjectorInfo
			{
				DLPCinemaProjectorIP = value2,
				ProjectorOrder = 1,
				SignalFormat = signalFormat,
				IsConnected = (config2 != null && !string.IsNullOrEmpty(config2.Value))
			});
		}
		return list;
	}

	[WebMethod]
	public EBoxSettings GetEBoxSettings()
	{
		try
		{
			throw new SoapException("Not implemented", new NotImplementedException(), base.Context, "Setup");
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Setup");
		}
	}

	[WebMethod]
	public EBoxSettings GetActiveEBoxSetting()
	{
		try
		{
			throw new SoapException("Not implemented", new NotImplementedException(), base.Context, "Setup");
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Setup");
		}
	}

	[WebMethod]
	public DBoxSettings GetDBoxSettings()
	{
		try
		{
			List<Qube.Thrift.Config> configs;
			using (PlayerClient playerClient = _GetPlayerClient())
			{
				configs = playerClient.Player.GetConfigs(_GetDBoxDeviceConfigs());
			}
			string value = _GetConfig(configs, ConfigKeys.AudioOutput).Value;
			bool flag = value == "aes";
			bool flag2 = value == "analog";
			bool flag3 = value == "ajaanalog";
			string value2 = _GetConfig(configs, ConfigKeys.AudioOffset).Value;
			string aesAudioOffset = ((flag || flag3) ? value2 : string.Empty);
			string analogAudioOffset = (flag2 ? value2 : string.Empty);
			bool isPSF = Convert.ToBoolean(_GetConfig(configs, ConfigKeys.PsF).Value);
			bool isAllowPlaybackOnError = Convert.ToBoolean(_GetConfig(configs, ConfigKeys.AllowPlaybackWithErrors).Value);
			bool isAutoDelete = true;
			List<ProjectorInfo> list = null;
			using (DBConnection dBConnection = new DBConnection())
			{
				isAutoDelete = Convert.ToBoolean(Qube.DAL.Config.GetValue(dBConnection, ConfigKeys.AutoDelete));
				list = _GetProjectorsInfo(dBConnection, configs);
			}
			int bufferSize = Convert.ToInt32(_GetConfig(configs, ConfigKeys.BufferLevel).Value);
			return new DBoxSettings(aesAudioOffset, analogAudioOffset, flag, flag2, list.ToArray(), isPSF, isAllowPlaybackOnError, isAutoDelete, bufferSize, flag3);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Setup");
		}
	}

	[WebMethod]
	public string PingIPAddress(string ipaddress)
	{
		Utils.ValidateNullOrEmpty(ipaddress, "ip address", "Setup");
		try
		{
			string text = "";
			int num = 0;
			Ping ping = new Ping();
			for (int i = 0; i < 4; i++)
			{
				Dns.GetHostAddresses(ipaddress);
				PingReply pingReply = ping.Send(ipaddress);
				if (pingReply.Status == IPStatus.Success)
				{
					Diagnostics.LogDebug(pingReply.Address.ToString() + " is pinged succesfully.");
					num++;
				}
				else
				{
					Diagnostics.LogDebug("Pinging failed for the " + ipaddress + " IP address as " + pingReply.ToString());
					text = pingReply.Status.ToString();
				}
			}
			return num + "," + text;
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Setup");
		}
	}

	[WebMethod]
	public bool Disconnect()
	{
		return DisconnectProjector(0);
	}

	[WebMethod]
	public bool ConnectIP(string ipaddress)
	{
		try
		{
			return ConnectProjector(new ProjectorInfo[1]
			{
				new ProjectorInfo
				{
					ProjectorOrder = 0,
					DLPCinemaProjectorIP = ipaddress
				}
			});
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			return false;
		}
	}

	[WebMethod]
	public bool DisconnectProjector(int projector)
	{
		try
		{
			Dictionary<string, string> dictionary = new Dictionary<string, string>();
			dictionary.Add(_GetKeyByProjectorOrder(projector), string.Empty);
			_SetConfigs(dictionary);
			List<Qube.Thrift.Config> list = _GetConfigs(dictionary.Keys.ToList());
			return !list.Exists((Qube.Thrift.Config projectorConfig) => !string.IsNullOrEmpty(projectorConfig.Value));
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Setup");
		}
	}

	[WebMethod]
	public bool ConnectProjector(ProjectorInfo[] projectors)
	{
		try
		{
			Utils.ValidateNullOrEmpty(projectors, "projector(s)", "Setup");
			using PlayerClient client = _GetPlayerClient();
			return _SaveProjectors(projectors, client);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Setup");
		}
	}

	[WebMethod]
	public bool ReconnectProjector(ProjectorInfo[] projectors)
	{
		try
		{
			Utils.ValidateNullOrEmpty(projectors, "projector(s)", "Setup");
			foreach (ProjectorInfo projectorInfo in projectors)
			{
				if (!string.IsNullOrEmpty(projectorInfo.DLPCinemaProjectorIP))
				{
					DisconnectProjector(projectorInfo.ProjectorOrder);
				}
			}
			using PlayerClient client = _GetPlayerClient();
			return _SaveProjectors(projectors, client);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Setup");
		}
	}

	[WebMethod]
	public void SaveTimeZone(string timeZone)
	{
		try
		{
			if (timeZone != null)
			{
				ITaskManager velaikaran = Utils.GetVelaikaran();
				velaikaran.SetTimeZone(timeZone);
				Diagnostics.LogInfo("Timezone is set to " + timeZone);
			}
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Setup");
		}
	}

	[WebMethod]
	public void SaveDBoxSettings(DBoxSettings settings)
	{
		try
		{
			SaveAutoDelete(settings.IsAutoDelete);
			Dictionary<string, string> dictionary = new Dictionary<string, string>();
			Dictionary<string, string> dictionary2 = _GetProjectorConfigsToSave(settings.Projectors);
			foreach (KeyValuePair<string, string> item in dictionary2)
			{
				if (!dictionary.ContainsKey(item.Key))
				{
					dictionary.Add(item.Key, item.Value);
				}
			}
			dictionary.Add(ConfigKeys.AllowPlaybackWithErrors, settings.IsAllowPlaybackOnError.ToString());
			string value = ((settings.IsAJAAnalogAudio || settings.IsDigitalAudio) ? settings.AESAudioOffset : settings.AnalogAudioOffset);
			dictionary.Add(ConfigKeys.AudioOffset, value);
			_SetConfigs(dictionary);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Setup");
		}
	}

	[WebMethod]
	public void SaveEBoxSettings(EBoxSettings settings)
	{
		try
		{
			throw new SoapException("Not implemented", new NotImplementedException(), base.Context, "Setup");
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Setup");
		}
	}

	[WebMethod]
	public MediaFolderInfo[] GetMediaFolderInfos()
	{
		try
		{
			using DBConnection connection = new DBConnection();
			MediaFolders mediaFolders = Qube.DAL.MediaFolder.GetMediaFolders(connection);
			MediaFolderInfo[] result = null;
			if (mediaFolders.Count == 0)
			{
				Diagnostics.LogDebug("No media folder available");
				return result;
			}
			int num = 0;
			result = new MediaFolderInfo[mediaFolders.Count];
			IMediaFolderEnumerator enumerator = mediaFolders.GetEnumerator();
			try
			{
				while (enumerator.MoveNext())
				{
					MediaFolder current = enumerator.Current;
					MediaFolderInfo value = new MediaFolderInfo(current.ID.ToString(), current.Path, current.Quota.ToString(), current.Cost, Qube.DAL.MediaFolder.IsReferred(connection, current));
					result.SetValue(value, num++);
				}
			}
			finally
			{
				if (enumerator is IDisposable disposable)
				{
					disposable.Dispose();
				}
			}
			return result;
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Setup");
		}
	}

	[WebMethod]
	public bool SaveMediaFolderInfo(MediaFolderInfo mediaFolderInfo)
	{
		try
		{
			mediaFolderInfo.Path += (mediaFolderInfo.Path.EndsWith(":") ? "\\" : "");
			Uri uri = new Uri(mediaFolderInfo.Path);
			if (uri.Scheme != Uri.UriSchemeFile || uri.IsUnc)
			{
				throw new SoapException(Resources.Common.unsupportedMediaFolder, Win32ErrorCode.ErrorNotSupported, Resources.Common.unsupportedMediaFolder, base.Context, "Setup");
			}
			using DBConnection conxn = new DBConnection();
			if (!Directory.Exists(mediaFolderInfo.Path))
			{
				Diagnostics.LogError(string.Format("{0} {1}", ResourceManager.GetString("invalidPath"), mediaFolderInfo.Path));
				throw new SoapException(Resources.Common.invalidPath, new DirectoryNotFoundException($"{Resources.Common.invalidPath} {mediaFolderInfo.Path}"), base.Context, "Setup");
			}
			if (_IsMediaFolderExist(conxn, mediaFolderInfo.Path, mediaFolderInfo.Id))
			{
				throw new SoapException(Resources.Common.mediafolderAlreadyExists, Win32ErrorCode.ErrorAlreadyExists, Resources.Common.mediafolderAlreadyExists, base.Context, "Setup");
			}
			string id = mediaFolderInfo.Id;
			string path = mediaFolderInfo.Path;
			int cost = mediaFolderInfo.Cost;
			ulong quotaInBytes = _ValidateQuota(path, Qube.DAL.MediaFolder.ConvertToBytes(Convert.ToUInt64(mediaFolderInfo.Quota)));
			return _Save(conxn, id, path, quotaInBytes, cost);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Setup");
		}
	}

	[WebMethod]
	public bool DeleteMediaFolder(MediaFolderInfo mediaFolderInfo)
	{
		try
		{
			using DBConnection dBConnection = new DBConnection();
			MediaFolder mediaFolder = new MediaFolder(new Guid(mediaFolderInfo.Id));
			mediaFolder.Path = mediaFolderInfo.Path;
			mediaFolder.Quota = Convert.ToUInt64(mediaFolderInfo.Quota);
			try
			{
				bool flag = false;
				dBConnection.BeginTran();
				flag = Qube.DAL.MediaFolder.Delete(dBConnection, mediaFolder);
				if (flag)
				{
					Diagnostics.LogInfo($"Media folder ({mediaFolder.Path}) is deleted successfully");
					_DeleteQubeStore(mediaFolder);
					_DeleteQubeStore(mediaFolder.Path);
				}
				else
				{
					Diagnostics.LogInfo($"Media folder ({mediaFolder.Path}) is not deleted");
				}
				dBConnection.Commit();
				return flag;
			}
			catch (Exception)
			{
				dBConnection.RollBack();
				throw;
			}
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Setup");
		}
	}

	[WebMethod]
	public string[] GetTimeZones()
	{
		try
		{
			ITaskManager velaikaran = Utils.GetVelaikaran();
			return velaikaran.GetTimeZones();
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Setup");
		}
	}

	[WebMethod]
	public string GetCurrentTimeZone()
	{
		try
		{
			ITaskManager velaikaran = Utils.GetVelaikaran();
			return velaikaran.GetCurrentTimeZone();
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Setup");
		}
	}

	[WebMethod]
	public void SaveBufferSize(int bufferSize)
	{
		try
		{
			Diagnostics.LogInfo("Buffer level set to " + bufferSize);
			Dictionary<string, string> dictionary = new Dictionary<string, string>();
			dictionary.Add(ConfigKeys.BufferLevel, bufferSize.ToString());
			_SetConfigs(dictionary);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Setup");
		}
	}

	[WebMethod]
	public void SaveAutoDelete(bool isAutoDelete)
	{
		try
		{
			Diagnostics.LogInfo("Auto delete value set to " + isAutoDelete);
			using DBConnection connection = new DBConnection();
			Qube.DAL.Config.Update(connection, ConfigKeys.AutoDelete, isAutoDelete.ToString());
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Setup");
		}
	}
}
