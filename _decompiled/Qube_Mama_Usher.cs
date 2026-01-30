using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.ServiceModel;
using System.Web.Script.Services;
using System.Web.Services;
using Qube.ASDCP;
using Qube.Contracts;
using Qube.DAL;
using Qube.ExtensionMethods;
using Qube.Kdms;
using Qube.Thrift;
using QubeCinema.Boys;
using QubeCinema.Usher;
using QubeStore;
using Resources;

namespace Qube.Mama;

[ScriptService]
[WebService(Namespace = "http://webservices.qubecinema.com/XP/Usher/2009-09-29/")]
[WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
public class Usher : WebService
{
	private Utils _utils;

	private List<JobInfo> _UpdateJobStatus(IUsherManager usherManager, List<JobInfo> jobs)
	{
		List<JobInfo> result = new List<JobInfo>();
		if (base.Session["UsherJobs"] == null)
		{
			return result;
		}
		string text = base.Session["UsherJobs"].ToString();
		if (text.Trim() == string.Empty)
		{
			return result;
		}
		foreach (JobInfo job in jobs)
		{
			int num = text.IndexOf(job.ID.ToString());
			if (num > -1)
			{
				text = text.Remove(num - 1, job.ID.ToString().Length + 1);
			}
		}
		base.Session["UsherJobs"] = text;
		if (text.Trim() == string.Empty)
		{
			return result;
		}
		string[] array = text.Split(',');
		if (array.Length > 0)
		{
			List<Guid> list = new List<Guid>();
			for (int i = 0; i < array.Length; i++)
			{
				if (array[i].Trim() != string.Empty)
				{
					list.Add(new Guid(array[i]));
				}
			}
			result = usherManager.GetJobsInfo(list.ToArray());
		}
		return result;
	}

	private StorageInfo _CreateStorageInfo(ulong totalSpace, ulong freeSpace)
	{
		StorageInfo storageInfo = new StorageInfo();
		if (totalSpace >= 1073741824 && freeSpace >= 1073741824)
		{
			storageInfo.Total = (uint)Math.Round((decimal)totalSpace / 1024m / 1024m / 1024m);
			storageInfo.Free = (uint)Math.Round((decimal)freeSpace / 1024m / 1024m / 1024m);
			storageInfo.Units = "GB";
		}
		else if (totalSpace >= 1048576 && freeSpace >= 1048576)
		{
			storageInfo.Total = (uint)Math.Round((decimal)totalSpace / 1024m / 1024m);
			storageInfo.Free = (uint)Math.Round((decimal)freeSpace / 1024m / 1024m);
			storageInfo.Units = "MB";
		}
		else if (totalSpace >= 1024 && freeSpace >= 1024)
		{
			storageInfo.Total = (uint)Math.Round((decimal)totalSpace / 1024m);
			storageInfo.Free = (uint)Math.Round((decimal)freeSpace / 1024m);
			storageInfo.Units = "KB";
		}
		else
		{
			storageInfo.Total = (uint)totalSpace;
			storageInfo.Free = (uint)freeSpace;
			storageInfo.Units = "Bytes";
		}
		return storageInfo;
	}

	private List<DCPEntities> _IngestTitles(IngestableTitle[] ingestableTitles)
	{
		if (ingestableTitles.Length == 0)
		{
			return new List<DCPEntities>();
		}
		List<DCPEntities> list = new List<DCPEntities>();
		ArrayList arrayList = new ArrayList();
		for (int i = 0; i < ingestableTitles.Length && ingestableTitles[i] != null; i++)
		{
			DCPEntity dCPEntity = new DCPEntity();
			dCPEntity.Id = new Guid(ingestableTitles[i].Id);
			dCPEntity.PackageId = new Guid(ingestableTitles[i].PackageId);
			arrayList.Add(dCPEntity);
			if (i + 1 == ingestableTitles.Length || ingestableTitles[i + 1] == null || ingestableTitles[i].Path != ingestableTitles[i + 1].Path)
			{
				DCPEntities dCPEntities = new DCPEntities();
				dCPEntities.Path = ingestableTitles[i].Path;
				dCPEntities.Entities = (DCPEntity[])arrayList.ToArray(typeof(DCPEntity));
				arrayList.Clear();
				list.Add(dCPEntities);
			}
		}
		if (list.Count == 0)
		{
			return list;
		}
		return list;
	}

	private void _IngestKey(string keyPath, string userName, string password)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			Qube.ASDCP.Kdm kdm = new Qube.ASDCP.Kdm();
			kdm.Path = keyPath;
			AuthenticationSchemes authSchemes = AuthenticationSchemes.None;
			QubeCinema.Usher.NetworkCredential credential = null;
			_GetCredentials(kdm.Path, userName, password, ref authSchemes, ref credential);
			Diagnostics.LogDebug("Ingesting key from  " + keyPath);
			usherManager.Injest(kdm, InjestType.Foreground, authSchemes, credential);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	private void _IngestFpm(string fpmPath, string userName, string password)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			Fpm fpm = new Fpm();
			fpm.Path = fpmPath;
			AuthenticationSchemes authSchemes = AuthenticationSchemes.None;
			QubeCinema.Usher.NetworkCredential credential = null;
			_GetCredentials(fpm.Path, userName, password, ref authSchemes, ref credential);
			Diagnostics.LogDebug("Ingesting fpm from  " + fpmPath);
			usherManager.Injest(fpm, InjestType.Foreground, authSchemes, credential);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	private void _GetCredentials(string path, string userName, string password, ref AuthenticationSchemes authSchemes, ref QubeCinema.Usher.NetworkCredential credential)
	{
		Uri uri = new Uri(path);
		if (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeFtp)
		{
			if (string.IsNullOrEmpty(userName) || (userName = userName.Trim()).Length == 0)
			{
				authSchemes = AuthenticationSchemes.Anonymous;
				credential = null;
			}
			else
			{
				authSchemes = AuthenticationSchemes.Basic;
				credential = new QubeCinema.Usher.NetworkCredential(userName, password);
			}
		}
		else
		{
			authSchemes = AuthenticationSchemes.Negotiate;
			if (string.IsNullOrEmpty(userName) || (userName = userName.Trim()).Length == 0)
			{
				credential = null;
			}
			else
			{
				credential = new QubeCinema.Usher.NetworkCredential(userName, password);
			}
		}
	}

	private void _DeleteTitle(Guid titleID, IDCPEntityServiceProvider dcpEntityServiceProvider)
	{
		try
		{
			if (dcpEntityServiceProvider == null)
			{
				Diagnostics.LogError(ResourceManager.GetString("dcpEntityServiceProviderNotFound"));
				throw SoapException.DCPEntityServiceProviderNotFoundException("Usher");
			}
			dcpEntityServiceProvider.DeleteAsset(titleID, AssetType.CPL);
		}
		catch (FaultException<Fault> ex)
		{
			Fault detail = ex.Detail;
			throw new SoapException(detail.Message, detail.StatusCode, detail.Message, base.Context, "Usher");
		}
		catch (AssetNotFoundException ex2)
		{
			throw new SoapException(ex2.Message, Win32ErrorCode.ObjectNotFound, ex2.Message, base.Context, "Usher");
		}
	}

	private IDCPEntityServiceProvider _GetDcpEntityServiceProvider()
	{
		IUsherManager usherManager = Utils.GetUsherManager();
		if (usherManager == null)
		{
			throw SoapException.UsherNotFoundException("Usher");
		}
		if (!(usherManager.GetService(typeof(IDCPEntityServiceProvider)) is IDCPEntityServiceProvider result))
		{
			Diagnostics.LogError(ResourceManager.GetString("dcpEntityServiceProviderNotFound"));
			throw SoapException.DCPEntityServiceProviderNotFoundException("Usher");
		}
		return result;
	}

	private void _DeleteKdms(List<Guid> kdms)
	{
		List<Guid> usedKdms = _GetLockedKdms();
		if (usedKdms != null && kdms.Exists((Guid kdm) => usedKdms.Contains(kdm)))
		{
			throw new SoapException(Resources.Common.unableToDeleteKdmSinceUsedInCurrentLoadedPlaylist, new InvalidOperationException(Resources.Common.unableToDeleteKdmSinceUsedInCurrentLoadedPlaylist), base.Context, "Usher");
		}
		IDCPEntityServiceProvider iDCPEntityServiceProvider = _GetDcpEntityServiceProvider();
		foreach (Guid kdm in kdms)
		{
			iDCPEntityServiceProvider.DeleteAsset(kdm, AssetType.KDM);
		}
	}

	private List<Guid> _GetLockedKdms()
	{
		PlayerClient playerClient = Utils.GetPlayerClient();
		if (playerClient == null)
		{
			return null;
		}
		using (playerClient)
		{
			using DBConnection dBConnection = new DBConnection();
			PlaybackInfo playbackInfo = playerClient.Player.GetPlaybackInfo();
			List<Guid> eventsID = Qube.DAL.Playlist.GetEventsID(dBConnection, new Guid(playbackInfo.PlaylistId));
			if (eventsID.Count == 0)
			{
				return null;
			}
			List<Guid> list = new List<Guid>();
			foreach (Guid item in eventsID)
			{
				if (!(Qube.DAL.Event.GetEvent(dBConnection, item) is PlayTitleEvent { Title: not null, Title: var title }) || !Qube.DAL.Title.IsEncrypted(dBConnection, title.ID))
				{
					continue;
				}
				List<Qube.Kdms.Kdm> kdms = Qube.DAL.Kdms.GetKdms(dBConnection, title.ID);
				foreach (Qube.Kdms.Kdm item2 in kdms)
				{
					if (!list.Contains(item2.Id))
					{
						list.Add(item2.Id);
					}
				}
			}
			return list;
		}
	}

	private IEnumerable<IngestableTitle> _ConvertToIngestableTitles(IEnumerable<IngestableDcp> dcps)
	{
		return dcps.Select((IngestableDcp dcp) => new IngestableTitle
		{
			Description = dcp.Description,
			Id = dcp.Id,
			IsIngested = dcp.IsIngested,
			Name = dcp.Name,
			PackageId = dcp.PackageId,
			Path = dcp.Path
		});
	}

	public Usher()
	{
		_utils = new Utils();
	}

	public static string GetIngestedObjectTypeName(Guid id)
	{
		if (id == new Guid("B56929FF-D7B0-45F9-A9C2-E1939923EE84"))
		{
			return "Composition";
		}
		if (id == new Guid("A8E3A1DE-C85A-47F1-8F4B-9FC0C45212CB"))
		{
			return "Kdm";
		}
		if (id == new Guid("6AAFA9E4-45C7-481E-8E5F-26A1BD373360"))
		{
			return "Show";
		}
		return null;
	}

	[WebMethod]
	public JobInfo GetCurrentJob()
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			Guid[] jobs = usherManager.GetJobs(JobType.Foreground);
			Guid[] array = jobs;
			foreach (Guid jobID in array)
			{
				IJobInfo jobInfo = usherManager.GetJobInfo(jobID);
				if (jobInfo.Status == JobStatus.Transferring)
				{
					return new JobInfo(jobInfo, 0m);
				}
			}
			return null;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod(EnableSession = true)]
	public JobInfo[] GetJobs()
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			List<JobInfo> incompleteJobsInfo = usherManager.GetIncompleteJobsInfo();
			List<JobInfo> collection = _UpdateJobStatus(usherManager, incompleteJobsInfo);
			string text = "";
			if (base.Session != null && base.Session["UsherJobs"] != null)
			{
				text = base.Session["UsherJobs"].ToString();
			}
			foreach (JobInfo item in incompleteJobsInfo)
			{
				text = text + "," + item.ID;
			}
			if (base.Session != null)
			{
				base.Session["UsherJobs"] = text;
			}
			incompleteJobsInfo.AddRange(collection);
			return incompleteJobsInfo.ToArray();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public Guid[] GetJobIds()
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			return usherManager.GetJobs();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public JobInfo[] GetJobsByIds(Guid[] jobIds)
	{
		if (jobIds == null || jobIds.Length == 0)
		{
			string message = string.Format(Resources.Common.NullOrEmptyItem, "jobs id");
			throw new SoapException(message, new ArgumentException(message), base.Context, "Usher");
		}
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			ArrayList arrayList = new ArrayList();
			string status = string.Empty;
			foreach (Guid guid in jobIds)
			{
				IJobInfo jobInfo = usherManager.GetJobInfo(guid);
				decimal verificationProgress = 0m;
				if (jobInfo.Status == JobStatus.IntegrityVerificationSuspended || jobInfo.Status == JobStatus.VerifyingIntegrity)
				{
					verificationProgress = usherManager.GetVerificationProgress(guid, out status);
				}
				JobInfo value = new JobInfo(jobInfo, verificationProgress);
				arrayList.Add(value);
			}
			return arrayList.ToArray(typeof(JobInfo)) as JobInfo[];
		}
		catch (JobNotFoundException ex)
		{
			throw new SoapException(ex.Message, Win32ErrorCode.ObjectNotFound, ex.Message, base.Context, "Usher");
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void SuspendJob(Guid jobId)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			usherManager.Suspend(jobId);
			IJobInfo jobInfo = usherManager.GetJobInfo(jobId);
			Diagnostics.LogDebug("Suspending " + jobInfo.Name);
		}
		catch (JobNotFoundException ex)
		{
			throw new SoapException(ex.Message, Win32ErrorCode.ObjectNotFound, ex.Message, base.Context, "Usher");
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void ResumeJob(Guid jobId)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			usherManager.Resume(jobId);
			IJobInfo jobInfo = usherManager.GetJobInfo(jobId);
			Diagnostics.LogDebug("Resuming " + jobInfo.Name);
		}
		catch (JobNotFoundException ex)
		{
			throw new SoapException(ex.Message, Win32ErrorCode.ObjectNotFound, ex.Message, base.Context, "Usher");
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Usher");
		}
	}

	[WebMethod(EnableSession = true)]
	public void CancelJob(Guid jobId)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			usherManager.Cancel(jobId);
			IJobInfo jobInfo = usherManager.GetJobInfo(jobId);
			Diagnostics.LogDebug("Ingesting " + jobInfo.Name + " is cancelled");
		}
		catch (JobNotFoundException ex)
		{
			throw new SoapException(ex.Message, Win32ErrorCode.ObjectNotFound, ex.Message, base.Context, "Usher");
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Usher");
		}
	}

	[WebMethod]
	public UsherState GetUsherState()
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			return usherManager.State;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void SuspendUsher()
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			usherManager.Suspend();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void ResumeUsher()
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			usherManager.Resume();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public StorageInfo GetStorageInfo()
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			IManager manager = usherManager.GetService(typeof(IManager)) as IManager;
			return _CreateStorageInfo((ulong)manager.GetTotalSpace(), (ulong)manager.GetFreeSpace());
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Usher");
		}
	}

	[WebMethod]
	public bool IsFile(string keyPath)
	{
		try
		{
			return !string.IsNullOrEmpty(Path.GetExtension(keyPath));
		}
		catch
		{
		}
		return false;
	}

	[WebMethod]
	public bool IsFileExists(string keyPath, string userName, string password)
	{
		try
		{
			Uri uri = new Uri(keyPath);
			ICredentials credentials = null;
			if (!string.IsNullOrEmpty(userName))
			{
				credentials = new System.Net.NetworkCredential(userName, password);
			}
			if ((uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps) && string.IsNullOrEmpty(Path.GetExtension(keyPath)))
			{
				return false;
			}
			FileUtils fileUtils = new FileUtils();
			if (uri.Scheme == Uri.UriSchemeFile && credentials != null)
			{
				using (Impersonator.Impersonate(uri, credentials))
				{
					return fileUtils.IsFileExists(uri, credentials);
				}
			}
			return fileUtils.IsFileExists(uri, credentials);
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.Message);
			return false;
		}
	}

	[WebMethod]
	public IngestableTitle[] GetIngestableTitles(string path, string userName, string password, string name, bool namedFlag)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			AuthenticationSchemes authSchemes = AuthenticationSchemes.None;
			QubeCinema.Usher.NetworkCredential credential = null;
			if (path == null || (path = path.Trim()).Length == 0)
			{
				path = null;
			}
			if (path == null)
			{
				authSchemes = AuthenticationSchemes.Negotiate;
			}
			else
			{
				_GetCredentials(path, userName, password, ref authSchemes, ref credential);
			}
			IDCPEntityServiceProvider iDCPEntityServiceProvider = usherManager.GetService(typeof(IDCPEntityServiceProvider)) as IDCPEntityServiceProvider;
			IEnumerable<IngestableDcp> ingestableEntities = iDCPEntityServiceProvider.GetIngestableEntities<IngestableDcp>(path, authSchemes, credential, Guid.Empty, AssetType.UNKNOWN, isDcp: true);
			if (namedFlag && !string.IsNullOrEmpty(path))
			{
				SaveNamedSpace(path, userName, password, name);
			}
			return _ConvertToIngestableTitles(ingestableEntities).ToArray();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public KeyInfo[] GetKeyInfo()
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			if (!(usherManager.GetService(typeof(IKeyInfoProvider)) is IKeyInfoProvider keyInfoProvider))
			{
				Diagnostics.LogError(ResourceManager.GetString("keyInfoProviderNotFound"));
				throw new SoapException(Resources.Common.keyInfoProviderNotFound, new InvalidOperationException(Resources.Common.keyInfoProviderNotFound), base.Context, "Usher");
			}
			return keyInfoProvider.GetKeyInfo();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public IngestableKey[] GetIngestableKeys(string path, string userName, string password, string name, bool namedFlag)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			AuthenticationSchemes authSchemes = AuthenticationSchemes.None;
			QubeCinema.Usher.NetworkCredential credential = null;
			if (path == null || (path = path.Trim()).Length == 0)
			{
				path = null;
			}
			if (path == null)
			{
				authSchemes = AuthenticationSchemes.Negotiate;
			}
			else
			{
				_GetCredentials(path, userName, password, ref authSchemes, ref credential);
			}
			IDCPEntityServiceProvider iDCPEntityServiceProvider = usherManager.GetService(typeof(IDCPEntityServiceProvider)) as IDCPEntityServiceProvider;
			IngestableKey[] result = iDCPEntityServiceProvider.GetIngestableEntities<IngestableKey>(path, authSchemes, credential, Guid.Empty, AssetType.KDM, isDcp: false).ToArray();
			if (namedFlag && path != null)
			{
				SaveNamedSpace(path, userName, password, name);
			}
			return result;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public string IngestTitlesInplace(IngestableTitle[] ingestableTitles)
	{
		try
		{
			Utils.ValidateNullOrEmpty(ingestableTitles, "ingestable title(s)", "Usher");
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			List<DCPEntities> list = _IngestTitles(ingestableTitles);
			if (list.Count == 0)
			{
				Diagnostics.LogError(ResourceManager.GetString("novalidIngestableTitles"));
				throw new SoapException(Resources.Common.novalidIngestableTitles, Win32ErrorCode.ErrorNoData, Resources.Common.novalidIngestableTitles, base.Context, "Usher");
			}
			usherManager.InjestInplace(list);
			return string.Empty;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public Guid[] IngestTitles(IngestableTitle[] ingestableTitles, string userName, string password)
	{
		try
		{
			Utils.ValidateNullOrEmpty(ingestableTitles, "ingestable title(s)", "Usher");
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			Guid[] array = null;
			List<DCPEntities> list = _IngestTitles(ingestableTitles);
			AuthenticationSchemes authSchemes = AuthenticationSchemes.None;
			QubeCinema.Usher.NetworkCredential credential = null;
			if (list.Count == 0)
			{
				Diagnostics.LogError(ResourceManager.GetString("novalidIngestableTitles"));
				throw new SoapException(Resources.Common.novalidIngestableTitles, Win32ErrorCode.ErrorNoData, Resources.Common.novalidIngestableTitles, base.Context, "Usher");
			}
			_GetCredentials(list[0].Path, userName, password, ref authSchemes, ref credential);
			return usherManager.Injest(list, InjestType.Foreground, authSchemes, credential);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (IngestErrorException ex2)
		{
			throw new SoapException(ex2.ToString(), ex2, base.Context, "Usher");
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void IngestKey(string keyEssence)
	{
		try
		{
			Utils.ValidateNullOrEmpty(keyEssence, "key essence", "Usher");
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			Qube.ASDCP.Key key = new Qube.ASDCP.Key();
			key.Essence = keyEssence;
			usherManager.Injest(key, InjestType.Foreground, AuthenticationSchemes.Anonymous, null);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void IngestKeyFrom(string keyPath, string userName, string password)
	{
		Utils.ValidateNullOrEmpty(keyPath, "key path", "Usher");
		_IngestKey(keyPath, userName, password);
	}

	[WebMethod]
	public void IngestFpmFrom(string fpmPath, string userName, string password)
	{
		Utils.ValidateNullOrEmpty(fpmPath, "fpm path", "Usher");
		_IngestFpm(fpmPath, userName, password);
	}

	[WebMethod]
	public void IngestSplFrom(string splPath, string userName, string password)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			Utils.ValidateNullOrEmpty(splPath, "spl path", "Usher");
			AuthenticationSchemes authSchemes = AuthenticationSchemes.None;
			QubeCinema.Usher.NetworkCredential credential = null;
			_GetCredentials(splPath, userName, password, ref authSchemes, ref credential);
			usherManager.Injest(splPath, InjestType.Foreground, authSchemes, credential);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void IngestKeys(IngestableKey[] keys, string userName, string password)
	{
		Utils.ValidateNullOrEmpty(keys, "ingestable key(s)", "Usher");
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			IEnumerable<Qube.ASDCP.Kdm> source = keys.Select((IngestableKey kdm) => new Qube.ASDCP.Kdm
			{
				Path = kdm.Path
			});
			AuthenticationSchemes authSchemes = AuthenticationSchemes.None;
			QubeCinema.Usher.NetworkCredential credential = null;
			string path = source.First().Path;
			_GetCredentials(path, userName, password, ref authSchemes, ref credential);
			Diagnostics.LogDebug("Ingesting key from  " + path);
			usherManager.Injest(source.ToArray(), InjestType.Foreground, authSchemes, credential);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public Guid[] Ingest(string path, string userName, string password)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			Utils.ValidateNullOrEmpty(path, "path", "Usher");
			Guid[] array = null;
			AuthenticationSchemes authSchemes = AuthenticationSchemes.None;
			QubeCinema.Usher.NetworkCredential credential = null;
			_GetCredentials(path, userName, password, ref authSchemes, ref credential);
			Diagnostics.LogDebug("Ingesting from " + path);
			return usherManager.Injest(path, InjestType.Foreground, authSchemes, credential);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void DeleteKDM(string kdmID)
	{
		Utils.ValidateNullOrEmpty(kdmID, "kdm id", "Usher");
		_DeleteKdms(new List<Guid>
		{
			new Guid(kdmID)
		});
	}

	[WebMethod]
	public void DeleteKDMs(string[] kdmIds)
	{
		Utils.ValidateNullOrEmpty(kdmIds, "kdm(s)", "Usher");
		List<Guid> list = new List<Guid>();
		for (int i = 0; i < kdmIds.Length; i++)
		{
			list.Add(new Guid(kdmIds[i]));
		}
		_DeleteKdms(list);
	}

	[WebMethod]
	public List<Qube.Contracts.NamedSpace> GetNamedSpaces()
	{
		try
		{
			using DBConnection connection = new DBConnection();
			return Qube.DAL.NamedSpace.GetNamedSpaces(connection);
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Usher");
		}
	}

	[WebMethod]
	public Qube.Contracts.NamedSpace GetNamedSpaceByID(Guid id)
	{
		try
		{
			using DBConnection dBConnection = new DBConnection();
			if (!Qube.DAL.NamedSpace.IsExists(dBConnection, id))
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.namedspace, id);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Usher");
			}
			return Qube.DAL.NamedSpace.GetNamedSpaceByID(dBConnection, id);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void DeleteNamedSpaceByID(Guid id)
	{
		try
		{
			using DBConnection conxn = new DBConnection();
			if (!Qube.DAL.NamedSpace.IsExists(conxn, id))
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.namedspace, id);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Usher");
			}
			Qube.DAL.NamedSpace.DeleteNamedSpaceByID(conxn, id);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void SaveNamedSpace(string path, string username, string password, string name)
	{
		try
		{
			if (name == null || name.Trim().Length == 0)
			{
				return;
			}
			Utils.ValidateNullOrEmpty(path, "path", "Usher");
			using DBConnection conxn = new DBConnection();
			Qube.DAL.NamedSpace.SaveNamedSpace(conxn, new Qube.Contracts.NamedSpace(Guid.Empty, name.Trim(), path.Trim(), username, password));
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void DeleteShow(string id)
	{
		Utils.ValidateNullOrEmpty(id, "show id", "Usher");
		if (!Utils.IsValidUUID(id))
		{
			throw SoapException.GetInvalidUUIDFormatException("Usher");
		}
		DeleteAsset(new Guid(id), AssetType.SPL);
	}

	[WebMethod]
	public void DeleteTitle(Guid titleID)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			IDCPEntityServiceProvider dcpEntityServiceProvider = usherManager.GetService(typeof(IDCPEntityServiceProvider)) as IDCPEntityServiceProvider;
			_DeleteTitle(titleID, dcpEntityServiceProvider);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void DeleteTitles(Guid[] titleIds)
	{
		try
		{
			Utils.ValidateNullOrEmpty(titleIds, "title(s)", "Usher");
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			IDCPEntityServiceProvider dcpEntityServiceProvider = usherManager.GetService(typeof(IDCPEntityServiceProvider)) as IDCPEntityServiceProvider;
			for (int i = 0; i < titleIds.Length; i++)
			{
				_DeleteTitle(titleIds[i], dcpEntityServiceProvider);
			}
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public bool IsVerified(Guid titleId)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			if (!(usherManager.GetService(typeof(IDCPEntityServiceProvider)) is IDCPEntityServiceProvider iDCPEntityServiceProvider))
			{
				throw new SoapException("dcpEntityServiceProvider not found", new InvalidOperationException("dcpEntityServiceProvider not found"), base.Context, "Usher");
			}
			return iDCPEntityServiceProvider.IsTitleVerified(titleId);
		}
		catch (SoapException ex)
		{
			throw ex;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public List<TitleIntegrityStatusInfo> GetVerifiedTitles()
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			if (!(usherManager.GetService(typeof(IDCPEntityServiceProvider)) is IDCPEntityServiceProvider iDCPEntityServiceProvider))
			{
				Diagnostics.LogError(ResourceManager.GetString("dcpEntityServiceProviderNotFound"));
				throw SoapException.DCPEntityServiceProviderNotFoundException("Usher");
			}
			Dictionary<Guid, string> titlesIntegrity = iDCPEntityServiceProvider.GetTitlesIntegrity();
			List<TitleIntegrityStatusInfo> list = new List<TitleIntegrityStatusInfo>();
			foreach (KeyValuePair<Guid, string> item in titlesIntegrity)
			{
				list.Add(new TitleIntegrityStatusInfo(item.Key, item.Value));
			}
			return list;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void VerifyTitles(Guid[] titles)
	{
		try
		{
			Utils.ValidateNullOrEmpty(titles, "title(s)", "Usher");
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			using DBConnection connection = new DBConnection();
			foreach (Guid guid in titles)
			{
				if (!Qube.DAL.Title.IsExists(connection, guid, isAllEntities: false))
				{
					string text = string.Format(Resources.Common.objectNotFound, Resources.Common.title, guid);
					throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Usher");
				}
				MediaFiles mediaFilesByTitle = Qube.DAL.MediaFile.GetMediaFilesByTitle(connection, guid);
				if (mediaFilesByTitle.Count == 0)
				{
					Diagnostics.LogWarn($"No mediafiles are available in this title: {guid}");
					continue;
				}
				List<FileInfoLE> list = new List<FileInfoLE>();
				IMediaFileEnumerator enumerator = mediaFilesByTitle.GetEnumerator();
				try
				{
					while (enumerator.MoveNext())
					{
						MediaFile current = enumerator.Current;
						if (current.MediaFileLocations.Count != 0)
						{
							try
							{
								list.Add(new FileInfoLE(current.ID, current.GetLeastCostPath(), current.ExpectedDigest, current.Size));
							}
							catch (FileNotFoundException)
							{
								Qube.DAL.MediaFile.UpdateCalculatedDigest(connection, current.ID, "Bad");
								throw;
							}
						}
					}
				}
				finally
				{
					if (enumerator is IDisposable disposable)
					{
						disposable.Dispose();
					}
				}
				usherManager.VerifyIntegrity(guid, list);
			}
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Usher");
		}
	}

	[WebMethod]
	public VerificationInfo[] GetVerificationInfos(Guid[] titles)
	{
		try
		{
			Utils.ValidateNullOrEmpty(titles, "title(s)", "Usher");
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			List<VerificationInfo> list = new List<VerificationInfo>();
			for (int i = 0; i < titles.Length; i++)
			{
				string status = "";
				decimal verificationProgress = usherManager.GetVerificationProgress(titles[i], out status);
				list.Add(new VerificationInfo(verificationProgress, status, titles[i]));
			}
			return list.ToArray();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void CancelTitleVerification(Guid titleId)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			usherManager.CancelIntegrityVerification(titleId);
			Diagnostics.LogDebug("Integrity verification cancelled to the title: " + titleId);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public Guid[] GetVerificationPendingTitles()
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			return usherManager.GetVerificationPendingList();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public Guid[] GetAssets(AssetType assetType)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			if (!(usherManager.GetService(typeof(IDCPEntityServiceProvider)) is IDCPEntityServiceProvider iDCPEntityServiceProvider))
			{
				Diagnostics.LogError(ResourceManager.GetString("dcpEntityServiceProviderNotFound"));
				throw SoapException.DCPEntityServiceProviderNotFoundException("Usher");
			}
			return iDCPEntityServiceProvider.GetAssets(assetType);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}

	[WebMethod]
	public string GetAssetXML(Guid assetId, AssetType assetType)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			if (!(usherManager.GetService(typeof(IDCPEntityServiceProvider)) is IDCPEntityServiceProvider iDCPEntityServiceProvider))
			{
				Diagnostics.LogError(ResourceManager.GetString("dcpEntityServiceProviderNotFound"));
				throw SoapException.DCPEntityServiceProviderNotFoundException("Usher");
			}
			return iDCPEntityServiceProvider.GetAssetXML(assetId, assetType);
		}
		catch (AssetNotFoundException ex)
		{
			throw new SoapException(ex.Message, Win32ErrorCode.ObjectNotFound, ex.Message, base.Context, "Usher");
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Usher");
		}
	}

	[WebMethod]
	public long GetAssetSize(Guid assetId, AssetType assetType)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			if (!(usherManager.GetService(typeof(IDCPEntityServiceProvider)) is IDCPEntityServiceProvider iDCPEntityServiceProvider))
			{
				Diagnostics.LogError(ResourceManager.GetString("dcpEntityServiceProviderNotFound"));
				throw SoapException.DCPEntityServiceProviderNotFoundException("Usher");
			}
			return iDCPEntityServiceProvider.GetAssetSize(assetId, assetType);
		}
		catch (AssetNotFoundException ex)
		{
			throw new SoapException(ex.Message, Win32ErrorCode.ObjectNotFound, ex.Message, base.Context, "Usher");
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Usher");
		}
	}

	[WebMethod]
	public string GetAssetURI(Guid assetId, AssetType assetType)
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			if (!(usherManager.GetService(typeof(IDCPEntityServiceProvider)) is IDCPEntityServiceProvider iDCPEntityServiceProvider))
			{
				Diagnostics.LogError(ResourceManager.GetString("dcpEntityServiceProviderNotFound"));
				throw SoapException.DCPEntityServiceProviderNotFoundException("Usher");
			}
			Uri uri = new Uri(iDCPEntityServiceProvider.GetAssetURI(assetId, assetType));
			return uri.ReplaceHost(base.Context.Request.Url.Host).GetPath();
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void DeleteAsset(Guid assetId, AssetType assetType)
	{
		try
		{
			if (assetType == AssetType.KDM)
			{
				_DeleteKdms(new List<Guid> { assetId });
			}
			else
			{
				IDCPEntityServiceProvider iDCPEntityServiceProvider = _GetDcpEntityServiceProvider();
				iDCPEntityServiceProvider.DeleteAsset(assetId, assetType);
			}
		}
		catch (FaultException<Fault> ex)
		{
			Fault detail = ex.Detail;
			throw new SoapException(detail.Message, detail.StatusCode, detail.Message, base.Context, "Usher");
		}
		catch (AssetNotFoundException ex2)
		{
			throw new SoapException(ex2.Message, Win32ErrorCode.ObjectNotFound, ex2.Message, base.Context, "Usher");
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex4)
		{
			Diagnostics.LogError(ex4.ToString());
			throw new SoapException(ex4.Message, ex4, base.Context, "Usher");
		}
	}

	[WebMethod]
	public void ClearTransferHistory()
	{
	}

	[WebMethod]
	public List<Feature> GetFeatures()
	{
		try
		{
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Usher");
			}
			if (!(usherManager.GetService(typeof(IFeatureServiceProvider)) is IFeatureServiceProvider featureServiceProvider))
			{
				Diagnostics.LogError(ResourceManager.GetString("featureInfoProviderNotFound"));
				throw new SoapException(Resources.Common.featureInfoProviderNotFound, new InvalidOperationException(Resources.Common.featureInfoProviderNotFound), base.Context, "Usher");
			}
			return featureServiceProvider.GetFeaturesInfo();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Usher");
		}
	}
}
