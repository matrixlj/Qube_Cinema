using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Security.Principal;
using System.Text;
using System.Web.Script.Services;
using System.Web.Services;
using System.Xml;
using System.Xml.Serialization;
using Qube.ASDCP;
using Qube.Contracts;
using Qube.DAL;
using Qube.ExtensionMethods;
using Qube.Thrift;
using Qube.XP;
using Qube.XP.Properties;
using QubeCinema;
using QubeCinema.Boys;
using QubeCinema.Usher;
using QubeStore;
using Resources;

namespace Qube.Mama;

[WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
[ScriptService]
[WebService(Namespace = "http://webservices.qubecinema.com/XP/Catalog/2010-07-16/")]
public class Catalog : WebService
{
	private Titles _GetTitles(DBConnection conxn, Guid type)
	{
		Titles result = new Titles();
		TitleType titleType = null;
		if (type == Guid.Empty)
		{
			result = Qube.DAL.Title.GetTitles(conxn);
		}
		else
		{
			titleType = Qube.DAL.TitleType.GetTitleType(conxn, type);
			if (titleType == null)
			{
				Diagnostics.LogInfo($"Given type {type} not found.");
				return result;
			}
			result = Qube.DAL.Title.GetTitles(conxn, titleType);
		}
		if (Diagnostics.IsDebugEnabled)
		{
			StringBuilder stringBuilder = new StringBuilder();
			if (titleType != null)
			{
				stringBuilder.AppendFormat("Type: {0}\n", titleType.Name);
			}
			stringBuilder.AppendFormat("The compositions are\n");
			for (int i = 0; i < result.Count; i++)
			{
				stringBuilder.AppendFormat("{0}\n", result[i].Name);
			}
			Diagnostics.LogDebug(stringBuilder.ToString());
		}
		return result;
	}

	private string _GetRatings(Title title)
	{
		string text = string.Empty;
		for (int i = 0; i < title.Ratings.Count; i++)
		{
			text += title.Ratings[i].Label;
			if (i != title.Ratings.Count - 1)
			{
				text += ",";
			}
		}
		return text;
	}

	private Guid _GetEventType(DBConnection conxn, Guid eventId)
	{
		return (Guid)SqlHelper.ExecuteScalar(conxn, "GetTypeofEvent", eventId);
	}

	private EventInfo _GetEvent(DBConnection conxn, Guid eventId)
	{
		return _GetEvent(conxn, eventId, isAllInfo: true);
	}

	private EventInfo _GetEvent(DBConnection conxn, Guid eventId, bool isAllInfo)
	{
		Event obj = Qube.DAL.Event.GetEvent(conxn, eventId);
		if (obj == null)
		{
			Diagnostics.LogError(string.Format(ResourceManager.GetString("objectNotFound"), "event", eventId));
			string text = string.Format(Resources.Common.objectNotFound, Resources.Common.evnt, eventId);
			throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
		}
		Guid type = _GetEventType(conxn, eventId);
		if (obj is PlayEvent)
		{
			PlayEvent playEvent = obj as PlayEvent;
			Track track = playEvent.Track;
			TrackInfo trackInfo = new TrackInfo(track.ID, track.Name, track.InPoint, track.Duration);
			return new PlayTrackEventInfo(playEvent.Id, type, playEvent.ToString(), playEvent.Duration, trackInfo);
		}
		if (obj is PlayTitleEvent)
		{
			PlayTitleEvent playTitleEvent = obj as PlayTitleEvent;
			Title title = playTitleEvent.Title;
			string ratings = string.Empty;
			if (isAllInfo)
			{
				ratings = _GetRatings(title);
			}
			TitleDetails details = Qube.DAL.TitleDetails.GetDetails(conxn, title);
			TitleInfo titleInfo = new TitleInfo(title.ID, title.Type.ID, title.Name, title.Duration, ratings, title.AspectRatioX / ((title.AspectRatioY > 0m) ? title.AspectRatioY : 1m));
			if (details.MediaType == EssenceType.UNDEFINED)
			{
				titleInfo.MediaFormat = new MediaFormat();
				titleInfo.MediaFormat.PictureFormat = Qube.DAL.Catalog.GetTitleVideoFormat(conxn, title);
				titleInfo.MediaFormat.AudioFormat = _GetTitleAudioFormat(conxn, title);
			}
			else
			{
				titleInfo.MediaFormat = _GetTitleAVFormat(conxn, title.ID, details.MediaType);
			}
			titleInfo.IsStereoscopic = details.IsStereoscopic;
			titleInfo.IsProtect = details.IsProtect;
			titleInfo.IsInplace = details.IsInplace;
			titleInfo.ValidTill = details.ValidTill;
			titleInfo.LastAccessed = details.LastAccessed;
			titleInfo.IsEncrypted = Qube.DAL.Title.IsEncrypted(conxn, title.ID);
			titleInfo.HasKey = false;
			if (titleInfo.IsEncrypted)
			{
				titleInfo.HasKey = Qube.DAL.Title.HasAllEncryptedKey(conxn, title.ID);
			}
			PlayTitleEventInfo playTitleEventInfo = new PlayTitleEventInfo(playTitleEvent.Id, type, playTitleEvent.ToString(), playTitleEvent.Duration, titleInfo);
			playTitleEventInfo.ContentID = title.ID.ToString();
			return playTitleEventInfo;
		}
		if (obj is CallPlaylistEvent)
		{
			CallPlaylistEvent callPlaylistEvent = obj as CallPlaylistEvent;
			Guid playlist = Guid.Empty;
			if (callPlaylistEvent.Playlist != null)
			{
				playlist = callPlaylistEvent.Playlist.ID;
			}
			Guid alias = Guid.Empty;
			if (callPlaylistEvent.Alias != null)
			{
				alias = callPlaylistEvent.Alias.ID;
			}
			string name = string.Empty;
			if (callPlaylistEvent.Alias != null)
			{
				name = callPlaylistEvent.Alias.Name;
			}
			else if (callPlaylistEvent.Playlist != null)
			{
				name = callPlaylistEvent.Playlist.Name;
			}
			CallPlaylistInfo callPlaylistInfo = new CallPlaylistInfo(playlist, alias, name);
			return new CallPlaylistEventInfo(callPlaylistEvent.Id, type, callPlaylistEvent.Playlist.Name, callPlaylistEvent.Duration, callPlaylistInfo);
		}
		if (obj is TriggerCueEvent)
		{
			TriggerCueEvent triggerCueEvent = obj as TriggerCueEvent;
			string action = ((triggerCueEvent.Action != null) ? "wait for ext trigger" : ((!triggerCueEvent.IsInfinite) ? "wait for duration" : "wait for panel key"));
			Timecode timecode = new Timecode(1000m, 0);
			timecode.Seconds = triggerCueEvent.Offset;
			return new WaitEventInfo(triggerCueEvent.Id, type, triggerCueEvent.WaitDuration, action, triggerCueEvent.Action, timecode.GetHMSF(), triggerCueEvent.Kind, triggerCueEvent.Parent.ToString());
		}
		if (obj is PlaylistCueEvent)
		{
			PlaylistCueEvent playlistCueEvent = obj as PlaylistCueEvent;
			Timecode timecode2 = new Timecode(1000m, 0);
			timecode2.Seconds = playlistCueEvent.Offset;
			return new CueEventInfo(playlistCueEvent.Id, type, 0m, playlistCueEvent.Action, timecode2.GetHMSF(), playlistCueEvent.Kind, playlistCueEvent.Parent.ToString());
		}
		return null;
	}

	private ShowInfo[] _GetShowInfo(Shows shows, bool isDuration)
	{
		int num = 0;
		ShowInfo[] array = new ShowInfo[shows.Count];
		IShowEnumerator enumerator = shows.GetEnumerator();
		try
		{
			while (enumerator.MoveNext())
			{
				Playlist current = enumerator.Current;
				ShowInfo showInfo = null;
				showInfo = ((!isDuration) ? new ShowInfo(current.ID, current.Name) : new ShowInfo(current.ID, current.Name, current.Duration));
				array.SetValue(showInfo, num++);
			}
			return array;
		}
		finally
		{
			if (enumerator is IDisposable disposable)
			{
				disposable.Dispose();
			}
		}
	}

	private Guid[] _GetAutoEventsByParent(DBConnection connection, Guid parent)
	{
		object[] parameterValues = new object[1] { parent };
		DataSet dataSet = SqlHelper.ExecuteDataset(connection, "GetPlaylistCueEventsByParent", parameterValues);
		DataSet dataSet2 = SqlHelper.ExecuteDataset(connection, "GetTriggerCueEventsByParent", parameterValues);
		Guid[] array = new Guid[dataSet.Tables[0].Rows.Count + dataSet2.Tables[0].Rows.Count];
		int i;
		for (i = 0; i < dataSet.Tables[0].Rows.Count; i++)
		{
			ref Guid reference = ref array[i];
			reference = (Guid)dataSet.Tables[0].Rows[i][0];
		}
		for (int j = 0; j < dataSet2.Tables[0].Rows.Count; j++)
		{
			ref Guid reference2 = ref array[i + j];
			reference2 = (Guid)dataSet2.Tables[0].Rows[j][0];
		}
		return array;
	}

	private List<EventInfo> _GetEventsLE(DBConnection conxn, List<EventInfo> events, Guid playlistid)
	{
		DataSet dataSet = SqlHelper.ExecuteDataset(conxn, CommandType.Text, $"SELECT  ple.event\r\n                                                    FROM\tplaylistevents ple\r\n                                                    WHERE   ple.playlist = '{playlistid}'\r\n                                                        AND ple.event is not null");
		if (dataSet.Tables.Count > 0 && dataSet.Tables[0].Rows.Count > 0)
		{
			foreach (DataRow row in dataSet.Tables[0].Rows)
			{
				DataSet dataSet2 = SqlHelper.ExecuteDataset(conxn, CommandType.Text, string.Format("SELECT  t.id, t.[name], t.type, td.duration\r\n                                                                FROM\tplaytitleevents pte, titles t, titledetails td\r\n                                                                WHERE   pte.event = '{0}'\r\n                                                                    AND t.id = pte.title \r\n\t                                                                AND td.title = t.id\r\n                                                                ", row["event"]));
				if (dataSet2.Tables.Count > 0 && dataSet2.Tables[0].Rows.Count > 0)
				{
					DataRow dataRow2 = dataSet2.Tables[0].Rows[0];
					events.Add(new EventInfo(new Guid(dataRow2["id"].ToString()), new Guid("89E4DD82-09CB-4778-A440-181C179EB0C8"), dataRow2["name"].ToString(), Convert.ToDecimal(dataRow2["duration"])));
					dataRow2 = null;
				}
				else
				{
					DataSet dataSet3 = SqlHelper.ExecuteDataset(conxn, CommandType.Text, string.Format("SELECT  cpl.playlist, p.name\r\n                                                                        FROM\tcallplaylistevents cpl, playlists p\r\n                                                                        WHERE   cpl.event = '{0}'\r\n\t                                                                        AND cpl.playlist = p.id", row["event"]));
					if (dataSet3.Tables.Count > 0 && dataSet3.Tables[0].Rows.Count > 0)
					{
						DataRow dataRow3 = dataSet3.Tables[0].Rows[0];
						Playlist playlist = new Playlist(new Guid(dataRow3["playlist"].ToString()));
						events.Add(new EventInfo(playlist.ID, new Guid("3AAB0056-0402-420F-AD5F-2E611D626F31"), dataRow3["name"].ToString(), playlist.Duration));
						playlist = null;
						dataRow3 = null;
					}
					dataSet3 = null;
				}
				dataSet2 = null;
			}
		}
		dataSet = null;
		return events;
	}

	private AudioInfo _GetTitleAudioFormat(DBConnection conxn, Title title)
	{
		AudioInfo result = _GetAudioFormat(conxn, title.ID);
		if (result.Channels == 0 && result.SampleRate == 0 && result.SampleSize == 0)
		{
			result = Qube.DAL.Catalog.GetTitleAudioFormat(conxn, title);
		}
		return result;
	}

	private AudioInfo _GetTitleAudioFormat(DBConnection conxn, Guid titleId)
	{
		AudioInfo result = _GetAudioFormat(conxn, titleId);
		if (result.Channels == 0 && result.SampleRate == 0 && result.SampleSize == 0)
		{
			result = Qube.DAL.Catalog.GetTitleAudioFormat(conxn, titleId);
		}
		return result;
	}

	private AudioInfo _GetAudioFormat(DBConnection conxn, Guid titleId)
	{
		DataSet dataSet = SqlHelper.ExecuteDataset(conxn, "GetTitleAVFormat", titleId);
		AudioInfo result = default(AudioInfo);
		if (dataSet.Tables.Count > 0 && dataSet.Tables[0].Rows.Count > 0 && !(dataSet.Tables[0].Rows[0]["Channels"] is DBNull))
		{
			DataRow dataRow = dataSet.Tables[0].Rows[0];
			result.Channels = Convert.ToUInt16(dataRow["Channels"]);
			result.SampleRate = Convert.ToUInt32(dataRow["SampleRate"]);
			result.SampleSize = Convert.ToUInt16(dataRow["AudioSampleSize"]);
		}
		return result;
	}

	private MediaFormat _GetTitleAVFormat(DBConnection conxn, Guid titleId, EssenceType pictureType)
	{
		MediaFormat mediaFormat = new MediaFormat();
		DataSet dataSet = SqlHelper.ExecuteDataset(conxn, "GetTitleAVFormat", titleId);
		if (dataSet.Tables.Count > 0 && dataSet.Tables[0].Rows.Count > 0)
		{
			DataRow dataRow = dataSet.Tables[0].Rows[0];
			PictureInfo pictureFormat = new PictureInfo
			{
				EssenceType = pictureType
			};
			if (!(dataRow["FPS"] is DBNull))
			{
				pictureFormat.FPS = (decimal)dataRow["FPS"];
				pictureFormat.Frames = Convert.ToUInt64(dataRow["Frames"]);
				pictureFormat.Height = Convert.ToUInt32(dataRow["Height"]);
				pictureFormat.SampleSize = Convert.ToUInt16(dataRow["VideoSampleSize"]);
				pictureFormat.Width = Convert.ToUInt32(dataRow["Width"]);
			}
			mediaFormat.PictureFormat = pictureFormat;
			AudioInfo audioFormat = default(AudioInfo);
			if (!(dataRow["Channels"] is DBNull))
			{
				audioFormat.Channels = Convert.ToUInt16(dataRow["Channels"]);
				audioFormat.SampleRate = Convert.ToUInt32(dataRow["SampleRate"]);
				audioFormat.SampleSize = Convert.ToUInt16(dataRow["AudioSampleSize"]);
			}
			mediaFormat.AudioFormat = audioFormat;
		}
		else
		{
			mediaFormat.PictureFormat = new PictureInfo
			{
				EssenceType = pictureType
			};
			mediaFormat.AudioFormat = default(AudioInfo);
		}
		return mediaFormat;
	}

	private string _GetSize(ulong size)
	{
		if (size >= 1073741824)
		{
			return Math.Round((decimal)size / 1024m / 1024m / 1024m, 1) + " GB";
		}
		if (size >= 1048576)
		{
			return Math.Round((decimal)size / 1024m / 1024m, 1) + " MB";
		}
		if (size >= 1024)
		{
			return Math.Round((decimal)size / 1024m / 1024m) + " KB";
		}
		return size + " Bytes";
	}

	private string _GetReferredPlayList(DBConnection conxn, string titleId)
	{
		if (titleId.Trim().Length == 0)
		{
			return null;
		}
		if (!Qube.DAL.Title.IsExists(conxn, new Guid(titleId), isAllEntities: false))
		{
			string text = string.Format(Resources.Common.objectNotFound, Resources.Common.title, titleId);
			throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
		}
		object obj = SqlHelper.ExecuteScalar(conxn, CommandType.Text, $"select top 1 Name from playtitleevents, playlists, playlistevents \r\n                              where title = '{titleId}' and playlistevents.event = playtitleevents.event \r\n                              and playlists.id = playlistevents.playlist and playlists.deleted = 0");
		if (obj != null)
		{
			return obj as string;
		}
		return null;
	}

	private bool _IsTitleProtected(DBConnection conxn, Guid titleId)
	{
		if (!Qube.DAL.Title.IsExists(conxn, titleId, isAllEntities: false))
		{
			string text = string.Format(Resources.Common.objectNotFound, Resources.Common.title, titleId);
			throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
		}
		object obj = SqlHelper.ExecuteScalar(conxn, CommandType.Text, $"SELECT protect FROM titleDetails WHERE title = '{titleId}' AND protect = 1");
		return obj != null;
	}

	private void _SaveShowPlaylist(Show show, Dictionary<Guid, List<PlaylistCueEvent>> playCueEvents)
	{
		try
		{
			bool isSplVersion5_0_ = false;
			string text = ConfigurationManager.AppSettings["SPLVersion"];
			if (text != null && text == "5.0.3")
			{
				isSplVersion5_0_ = true;
			}
			IUsherManager usherManager = Utils.GetUsherManager();
			if (usherManager == null)
			{
				throw SoapException.UsherNotFoundException("Catalog");
			}
			if (!(usherManager.GetService(typeof(IDCPEntityServiceProvider)) is IDCPEntityServiceProvider iDCPEntityServiceProvider))
			{
				Diagnostics.LogError(ResourceManager.GetString("dcpEntityServiceProviderNotFound"));
				throw SoapException.DCPEntityServiceProviderNotFoundException("Catalog");
			}
			ShowBuilderLE showLE = new ShowBuilderLE(show.ID, show.Name, show.Events);
			iDCPEntityServiceProvider.SaveShowPlaylist(showLE, playCueEvents, isSplVersion5_0_);
		}
		catch (Exception ex)
		{
			Diagnostics.LogError($"Error while saving show playlist. \n{show.Name} \nId : {show.ID.ToString()} \n {ex.ToString()}");
		}
	}

	private DateTime _ParseDateTime(string dateTime)
	{
		if (!DateTime.TryParse(dateTime, out var result) && !DateTime.TryParse(dateTime, CultureInfo.InvariantCulture, DateTimeStyles.None, out result))
		{
			throw new FormatException($"Given date time value {dateTime} format is invalid");
		}
		return result;
	}

	private DeviceInfo _GetDevice()
	{
		int loadAhead = 0;
		bool loopplayback = false;
		using (DBConnection connection = new DBConnection())
		{
			loadAhead = Convert.ToInt32(Qube.DAL.Config.GetValue(connection, ConfigKeys.BufferLevel));
			loopplayback = Convert.ToBoolean(Qube.DAL.Config.GetValue(connection, ConfigKeys.LoopPlayback));
		}
		DeviceInfo deviceInfo = new DeviceInfo();
		deviceInfo.ID = Dalapathi.DEVICE_ID;
		deviceInfo.LoadAhead = loadAhead;
		deviceInfo.Loopplayback = loopplayback;
		deviceInfo.Name = "HDSDI Output";
		deviceInfo.Port = Ports.PeProxyPort;
		return deviceInfo;
	}

	[WebMethod]
	public NetworkAdsType GetNetworkAdsType()
	{
		return new NetworkAdsType();
	}

	[WebMethod]
	public IntervalAdsType GetIntervalAdsType()
	{
		return new IntervalAdsType();
	}

	[WebMethod]
	public LocalAdsType GetLocalAdsType()
	{
		return new LocalAdsType();
	}

	[WebMethod]
	public PreShowAdsType GetPreShowAdsType()
	{
		return new PreShowAdsType();
	}

	[WebMethod]
	public FeatureType GetFeatureType()
	{
		return new FeatureType();
	}

	[WebMethod]
	public TrailerType GetTrailerType()
	{
		return new TrailerType();
	}

	[WebMethod]
	public TransitionalType GetTransitionalType()
	{
		return new TransitionalType();
	}

	[WebMethod]
	public AdvertisementType GetAdvertisementType()
	{
		return new AdvertisementType();
	}

	[WebMethod]
	public ShortType GetShortType()
	{
		return new ShortType();
	}

	[WebMethod]
	public PSAType GetPSAType()
	{
		return new PSAType();
	}

	[WebMethod]
	public PolicyType GetPolicyType()
	{
		return new PolicyType();
	}

	[WebMethod]
	public TestType GetTestType()
	{
		return new TestType();
	}

	[WebMethod]
	public RatingType GetRatingType()
	{
		return new RatingType();
	}

	[WebMethod]
	public TeaserType GetTeaserType()
	{
		return new TeaserType();
	}

	[WebMethod]
	public PlayTitleEventType GetPlayTitleEventType()
	{
		return new PlayTitleEventType();
	}

	[WebMethod]
	public PlayTrackEventType GetPlayTrackEventType()
	{
		return new PlayTrackEventType();
	}

	[WebMethod]
	public CallPlaylistEventType GetCallPlaylistEventType()
	{
		return new CallPlaylistEventType();
	}

	[WebMethod]
	public PlaylistCueEventType GetPlaylistCueEventType()
	{
		return new PlaylistCueEventType();
	}

	[WebMethod]
	public TriggerCueEventType GetTriggerCueEventType()
	{
		return new TriggerCueEventType();
	}

	[WebMethod]
	public WaitEventInfo CreateWaitEventInfo()
	{
		return new WaitEventInfo();
	}

	[WebMethod]
	public CueEventInfo CreateCueEventInfo()
	{
		return new CueEventInfo();
	}

	[WebMethod]
	public string GetCertificate(CertificateType certificateType)
	{
		try
		{
			CertificateProvider certificateProvider = new CertificateProvider();
			string pemCertificates = certificateProvider.GetPemCertificates(certificateType);
			if (pemCertificates.Length == 0)
			{
				string text = $"{certificateType.ToString()} certificate not found.";
				throw new SoapException(text, Win32ErrorCode.ErrorNoData, text, base.Context, "Catalog");
			}
			return pemCertificates;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public string SaveSchedule(string showId, string dt, string tme, string scheduleId)
	{
		Utils.ValidateNullOrEmpty(showId, "show id", "Catalog");
		Utils.ValidateNullOrEmpty(dt, "date", "Catalog");
		Utils.ValidateNullOrEmpty(tme, "time", "Catalog");
		if (!Utils.IsValidUUID(showId))
		{
			throw SoapException.GetInvalidUUIDFormatException("Catalog");
		}
		try
		{
			DateTime dateTime = _ParseDateTime($"{dt} {tme}");
			if (DateTime.Compare(dateTime, DateTime.Now) < 0)
			{
				string message = string.Format("{0}! {1}: {2}", ResourceManager.GetString("cannotScheduleAnEventInThePast"), ResourceManager.GetString("serverTimeIs"), DateTime.Now.ToString());
				Diagnostics.LogError(message);
				throw new SoapException(message, new ArgumentOutOfRangeException(Resources.Common.invalidDatetime), base.Context, "Catalog");
			}
			using DBConnection connection = new DBConnection();
			Show show = Qube.DAL.Show.GetShow(connection, new Guid(showId));
			if (show == null)
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.show, showId);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			bool flag = string.IsNullOrEmpty(scheduleId) || scheduleId.Trim().Length == 0;
			if (Qube.DAL.ShowSchedule.IsTimeScheduled(connection, dateTime, new Guid(showId), flag ? Guid.Empty : new Guid(scheduleId)))
			{
				Diagnostics.LogError(ResourceManager.GetString("timeNotAvailabe"));
				throw new SoapException(Resources.Common.timeNotAvailabe, Win32ErrorCode.ErrorAlreadyExists, Resources.Common.timeNotAvailabe, base.Context, "Catalog");
			}
			ShowSchedule showSchedule = new ShowSchedule();
			if (flag)
			{
				showSchedule.Id = Guid.NewGuid();
			}
			else
			{
				showSchedule.Id = new Guid(scheduleId);
			}
			showSchedule.Show = show;
			showSchedule.StartTime = dateTime;
			Diagnostics.LogInfo($"Show '{showSchedule.Show.Name}' scheduled at {showSchedule.StartTime.ToLongDateString()} {showSchedule.StartTime.ToLongTimeString()}");
			Qube.DAL.ShowSchedule.Save(connection, showSchedule);
			try
			{
				ITaskManager velaikaran = Utils.GetVelaikaran();
				velaikaran.NotifyScheduler();
			}
			catch (InvalidOperationException)
			{
				Diagnostics.LogError(ResourceManager.GetString("velaikaranServiceNotAvailable"));
			}
			return showSchedule.Id.ToString();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public ShowInfo[] GetShows(bool isAll)
	{
		return GetAllShows(isAll, isDuration: true);
	}

	[WebMethod]
	public ShowInfo[] GetAllShows(bool isAll, bool isDuration)
	{
		try
		{
			using DBConnection connection = new DBConnection();
			ShowInfo[] result = null;
			Shows shows = Qube.DAL.Show.GetShows(connection);
			if (shows.Count == 0)
			{
				Diagnostics.LogDebug("GetShows(): no shows available");
				return result;
			}
			if (isAll)
			{
				result = _GetShowInfo(shows, isDuration);
			}
			else
			{
				Shows shows2 = new Shows();
				IShowEnumerator enumerator = shows.GetEnumerator();
				try
				{
					while (enumerator.MoveNext())
					{
						Show current = enumerator.Current;
						shows2.Add(current);
					}
				}
				finally
				{
					if (enumerator is IDisposable disposable)
					{
						disposable.Dispose();
					}
				}
				if (shows2.Count == 0)
				{
					Diagnostics.LogDebug("GetShows(): No Playable shows available");
				}
				result = _GetShowInfo(shows2, isDuration);
			}
			if (Diagnostics.IsDebugEnabled)
			{
				StringBuilder stringBuilder = new StringBuilder();
				stringBuilder.AppendFormat("List of {0} shows\n", isAll ? "All" : "Playable");
				ShowInfo[] array = result;
				foreach (ShowInfo showInfo in array)
				{
					stringBuilder.AppendFormat("{0}\n", showInfo.Name);
				}
				Diagnostics.LogDebug(stringBuilder.ToString());
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
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public ShowInfo GetShow(Guid id)
	{
		try
		{
			using DBConnection connection = new DBConnection();
			Show show = Qube.DAL.Show.GetShow(connection, id);
			if (show == null)
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.show, id);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			return new ShowInfo(show.ID, show.Name, show.Duration);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public object GetShowDuration(Guid id, bool isHMS)
	{
		try
		{
			using DBConnection connection = new DBConnection();
			Show show = Qube.DAL.Show.GetShow(connection, id);
			if (show == null)
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.show, id);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			if (!isHMS)
			{
				return show.Duration;
			}
			Timecode timecode = new Timecode(1000m, 0);
			timecode.Seconds = show.Duration;
			return timecode.GetHMS();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[XmlInclude(typeof(CueEventInfo))]
	[XmlInclude(typeof(WaitEventInfo))]
	[WebMethod]
	[XmlInclude(typeof(TitleInfo))]
	[XmlInclude(typeof(PlayTitleEventInfo))]
	[XmlInclude(typeof(CallPlaylistEventInfo))]
	[XmlInclude(typeof(PlayTrackEventInfo))]
	public EventInfo[] GetShowEvents(Guid showId)
	{
		return GetAllShowEvents(showId, isAllInfo: true);
	}

	[XmlInclude(typeof(TitleInfo))]
	[XmlInclude(typeof(WaitEventInfo))]
	[XmlInclude(typeof(PlayTitleEventInfo))]
	[WebMethod]
	[XmlInclude(typeof(CallPlaylistEventInfo))]
	[XmlInclude(typeof(PlayTrackEventInfo))]
	[XmlInclude(typeof(CueEventInfo))]
	public EventInfo[] GetAllShowEvents(Guid showId, bool isAllInfo)
	{
		try
		{
			using DBConnection dBConnection = new DBConnection();
			PlaylistTemplate playlistTemplate = Qube.DAL.PlaylistTemplate.Get(dBConnection, showId);
			Events events = null;
			if (playlistTemplate == null)
			{
				Playlist playlist = Qube.DAL.Playlist.GetPlaylist(dBConnection, showId);
				if (playlist == null)
				{
					string text = string.Format(Resources.Common.objectNotFound, Resources.Common.playlist, showId);
					throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
				}
				events = playlist.Events;
			}
			else
			{
				Show show = Qube.DAL.Show.GetShow(playlistTemplate);
				events = show.Events;
			}
			List<EventInfo> list = new List<EventInfo>();
			if (events == null || events.Count == 0)
			{
				Diagnostics.LogDebug("GetShowEvents():There are no Events available");
				return list.ToArray();
			}
			IEventEnumerator enumerator = events.GetEnumerator();
			try
			{
				while (enumerator.MoveNext())
				{
					Event current = enumerator.Current;
					if (current is PlayTitleEvent)
					{
						EventInfo eventInfo = _GetEvent(dBConnection, current.Id, isAllInfo);
						list.Add(eventInfo);
						Guid[] array = _GetAutoEventsByParent(dBConnection, current.Id);
						Guid[] array2 = array;
						foreach (Guid eventId in array2)
						{
							EventInfo item = _GetEvent(dBConnection, eventId, isAllInfo);
							if (eventInfo != null)
							{
								list.Add(item);
							}
						}
					}
					else if (current is CallPlaylistEvent)
					{
						CallPlaylistEvent callPlaylistEvent = current as CallPlaylistEvent;
						CallPlaylistInfo callPlaylistInfo = new CallPlaylistInfo(callPlaylistEvent.Playlist.ID, Guid.Empty, callPlaylistEvent.Playlist.Name);
						CallPlaylistEventInfo item2 = new CallPlaylistEventInfo(callPlaylistEvent.Id, new Guid(EventTypes.CallPlaylistEvent), callPlaylistEvent.Playlist.Name, callPlaylistEvent.Duration, callPlaylistInfo);
						list.Add(item2);
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
			return list.ToArray();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public string GetPlaylistFirstEvent(Guid playlistID)
	{
		try
		{
			using DBConnection connection = new DBConnection();
			Playlist playlist = Qube.DAL.Playlist.GetPlaylist(connection, playlistID);
			if (playlist == null)
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.playlist, playlistID);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			return playlist.NextEvent(Guid.Empty)?.Id.ToString();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public ShowInfo GetShowInfoLE(Guid id)
	{
		try
		{
			using DBConnection dBConnection = new DBConnection();
			Show show = Qube.DAL.Show.GetShow(dBConnection, id);
			if (show == null)
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.show, id);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			List<EventInfoLE> list = new List<EventInfoLE>();
			list = Qube.DAL.Playlist.GetEventsLE(dBConnection, id);
			return new ShowInfo(show.ID, show.Name, show.Duration, list.ToArray());
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public ShowInfo GetShowInfo(Guid id)
	{
		return GetAllShowInfo(id, isAllInfo: true);
	}

	[WebMethod]
	public ShowInfo GetAllShowInfo(Guid id, bool isAllInfo)
	{
		try
		{
			using DBConnection dBConnection = new DBConnection();
			Show show = Qube.DAL.Show.GetShow(dBConnection, id);
			if (show == null)
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.show, id);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			Playlist playlist = Qube.DAL.Playlist.GetPlaylist(dBConnection, id);
			Events events = playlist.Events;
			decimal duration = 0m;
			if (events == null || events.Count == 0)
			{
				return new ShowInfo(show.ID, show.Name, duration);
			}
			List<EventInfo> list = new List<EventInfo>();
			IEventEnumerator enumerator = events.GetEnumerator();
			try
			{
				while (enumerator.MoveNext())
				{
					Event current = enumerator.Current;
					EventInfo eventInfo = _GetEvent(dBConnection, current.Id, isAllInfo);
					list.Add(eventInfo);
					if (!(current is PlayTitleEvent) && !(current is CallPlaylistEvent))
					{
						continue;
					}
					Guid[] array = _GetAutoEventsByParent(dBConnection, current.Id);
					Guid[] array2 = array;
					foreach (Guid eventId in array2)
					{
						EventInfo item = _GetEvent(dBConnection, eventId, isAllInfo);
						if (eventInfo != null)
						{
							list.Add(item);
						}
					}
					duration += eventInfo.Duration;
				}
			}
			finally
			{
				if (enumerator is IDisposable disposable)
				{
					disposable.Dispose();
				}
			}
			return new ShowInfo(show.ID, show.Name, duration, list.ToArray());
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public EventInfo GetEvent(Guid eventId)
	{
		try
		{
			using DBConnection conxn = new DBConnection();
			return _GetEvent(conxn, eventId);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public CallPlaylistInfo[] GetCallPlayLists()
	{
		try
		{
			using DBConnection connection = new DBConnection();
			Playlists nonShowNonTitlePlaylists = Qube.DAL.Playlist.GetNonShowNonTitlePlaylists(connection);
			List<CallPlaylistInfo> list = new List<CallPlaylistInfo>();
			if (nonShowNonTitlePlaylists == null || nonShowNonTitlePlaylists.Count == 0)
			{
				Diagnostics.LogDebug("No CallPlayList available");
				return list.ToArray();
			}
			IPlaylistEnumerator enumerator = nonShowNonTitlePlaylists.GetEnumerator();
			try
			{
				while (enumerator.MoveNext())
				{
					Playlist current = enumerator.Current;
					CallPlaylistInfo item = new CallPlaylistInfo(current.ID, Guid.Empty, current.Name);
					list.Add(item);
				}
			}
			finally
			{
				if (enumerator is IDisposable disposable)
				{
					disposable.Dispose();
				}
			}
			return list.ToArray();
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public TitleInfo[] GetTitles(string type)
	{
		try
		{
			using DBConnection dBConnection = new DBConnection();
			List<TitleInfo> list = new List<TitleInfo>();
			DataSet dataSet = SqlHelper.ExecuteDataset(dBConnection, "GetTitlesInfo", type);
			if (dataSet.Tables.Count > 0 && dataSet.Tables[0].Rows.Count > 0)
			{
				IUsherManager usherManager = Utils.GetUsherManager();
				if (usherManager == null)
				{
					throw SoapException.UsherNotFoundException("Catalog");
				}
				IManager manager = usherManager.GetService(typeof(IManager)) as IManager;
				long totalSpace = manager.GetTotalSpace();
				EssenceType essenceType = EssenceType.UNDEFINED;
				foreach (DataRow row in dataSet.Tables[0].Rows)
				{
					Guid guid = new Guid(row["id"].ToString());
					TitleInfo titleInfo = new TitleInfo(guid, new Guid(row["type"].ToString()), row["name"].ToString(), Convert.ToDecimal(row["duration"]), (row["ratings"] == DBNull.Value) ? string.Empty : row["ratings"].ToString(), Convert.ToDecimal(row["aspect"]));
					if (titleInfo.Duration == 0m)
					{
						titleInfo.Duration = Qube.DAL.Playlist.GetDuration(dBConnection, guid);
					}
					essenceType = (EssenceType)row["mediatype"];
					titleInfo.MediaFormat = _GetTitleAVFormat(dBConnection, guid, essenceType);
					titleInfo.Size = row["size"].ToString();
					titleInfo.IsInplace = Convert.ToBoolean(row["inplace"]);
					decimal spaceOccupied = 0m;
					if (!titleInfo.IsInplace)
					{
						spaceOccupied = Convert.ToDecimal(titleInfo.Size) / (decimal)totalSpace * 100m;
					}
					titleInfo.SpaceOccupied = spaceOccupied;
					titleInfo.IsProtect = Convert.ToBoolean(row["protect"]);
					if (row["validtill"] != DBNull.Value)
					{
						titleInfo.ValidTill = Convert.ToDateTime(row["validtill"]);
					}
					titleInfo.IsStereoscopic = Convert.ToBoolean(row["stereoscopic"]);
					if (row["lastaccessed"] != DBNull.Value)
					{
						titleInfo.LastAccessed = Convert.ToDateTime(row["lastaccessed"]);
					}
					titleInfo.IsEncrypted = Convert.ToBoolean(row["isencrypted"]);
					titleInfo.HasKey = Convert.ToBoolean(row["haskey"]);
					titleInfo.HasSubtitle = Convert.ToBoolean(row["hassubtitle"]);
					list.Add(titleInfo);
				}
			}
			else
			{
				if (type == null || type.Trim().Length == 0)
				{
					Diagnostics.LogDebug("No composition available");
				}
				else
				{
					Diagnostics.LogDebug("No composition available for the type of " + ((type.ToLower() == "other") ? "Others" : Qube.DAL.TitleType.GetTitleType(dBConnection, new Guid(type)).Name));
				}
				TitleInfo titleInfo2 = new TitleInfo(Guid.Empty, (type == null || type.Trim() == "other" || type.Trim().Length == 0) ? Guid.Empty : new Guid(type), null, 0m, null, 0m);
				titleInfo2.MediaFormat = null;
				list.Add(titleInfo2);
			}
			return list.ToArray();
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public TitleInfo GetTitle(Guid id)
	{
		try
		{
			using DBConnection dBConnection = new DBConnection();
			Title title = Qube.DAL.Title.GetTitle(dBConnection, id);
			if (title == null)
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.title, id);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			TitleInfo titleInfo = new TitleInfo(title.ID, title.Type.ID, title.Name, title.Duration, _GetRatings(title), title.AspectRatioX / title.AspectRatioY);
			TitleDetails details = Qube.DAL.TitleDetails.GetDetails(dBConnection, title);
			titleInfo.IsInplace = details.IsInplace;
			titleInfo.IsProtect = details.IsProtect;
			titleInfo.ValidTill = details.ValidTill;
			titleInfo.IsStereoscopic = details.IsStereoscopic;
			titleInfo.IsEncrypted = Qube.DAL.Title.IsEncrypted(dBConnection, title.ID);
			titleInfo.HasKey = false;
			if (titleInfo.IsEncrypted)
			{
				titleInfo.HasKey = Qube.DAL.Title.HasAllEncryptedKey(dBConnection, title.ID);
			}
			if (details.MediaType == EssenceType.UNDEFINED)
			{
				titleInfo.MediaFormat = new MediaFormat();
				titleInfo.MediaFormat.PictureFormat = Qube.DAL.Catalog.GetTitleVideoFormat(dBConnection, title);
				titleInfo.MediaFormat.AudioFormat = _GetTitleAudioFormat(dBConnection, title);
			}
			else
			{
				titleInfo.MediaFormat = _GetTitleAVFormat(dBConnection, id, details.MediaType);
			}
			return titleInfo;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public TrackInfo GetTrack(Guid id)
	{
		try
		{
			using DBConnection connection = new DBConnection();
			Track track = Qube.DAL.Track.GetTrack(connection, id);
			if (track == null)
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.track, id);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			return new TrackInfo(track.ID, track.Name, track.InPoint, track.Duration);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public TrackInfo[] GetTracks()
	{
		try
		{
			using DBConnection connection = new DBConnection();
			Tracks tracks = Qube.DAL.Track.GetTracks(connection);
			TrackInfo[] result = null;
			if (tracks == null || tracks.Count == 0)
			{
				Diagnostics.LogDebug("GetTracks(): There are no Tracks available of the given ID");
				return result;
			}
			int num = 0;
			result = new TrackInfo[tracks.Count];
			ITrackEnumerator enumerator = tracks.GetEnumerator();
			try
			{
				while (enumerator.MoveNext())
				{
					Track current = enumerator.Current;
					TrackInfo value = new TrackInfo(current.ID, current.Name, current.InPoint, current.Duration);
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
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public TrackInfo[] GetTitleTracks(Guid id)
	{
		try
		{
			using DBConnection connection = new DBConnection();
			Title title = Qube.DAL.Title.GetTitle(connection, id);
			if (title == null || title.TitleTracks.Count == 0)
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.titleTrack, id);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			int num = 0;
			TrackInfo[] array = new TrackInfo[title.TitleTracks.Count];
			ITitleTrackEnumerator enumerator = title.TitleTracks.GetEnumerator();
			try
			{
				while (enumerator.MoveNext())
				{
					TitleTrack current = enumerator.Current;
					TrackInfo value = new TrackInfo(current.Track.ID, current.Track.Name, current.Track.InPoint, current.Track.Duration);
					array.SetValue(value, num++);
				}
			}
			finally
			{
				if (enumerator is IDisposable disposable)
				{
					disposable.Dispose();
				}
			}
			return array;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public DeviceInfo[] GetDevices()
	{
		try
		{
			return new DeviceInfo[1] { _GetDevice() };
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public DeviceInfo GetActiveDevice()
	{
		try
		{
			using PlayerClient playerClient = Utils.GetPlayerClient();
			if (playerClient == null)
			{
				return null;
			}
			return _GetDevice();
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public decimal GetShowStoppedPosition(string serialno, Guid showId)
	{
		try
		{
			using DBConnection connection = new DBConnection();
			if (!Qube.DAL.Playlist.IsExists(connection, showId))
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.show, showId);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			PlaylistPlayInfo lastPlaylistPlayInfo = Qube.DAL.Playlog.GetLastPlaylistPlayInfo(connection, showId);
			if (lastPlaylistPlayInfo == null || lastPlaylistPlayInfo.Offset == -1m)
			{
				return 0m;
			}
			return lastPlaylistPlayInfo.Offset;
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public string SaveShow(string name, string id, EventInfo[] eventInfos)
	{
		Dictionary<Guid, List<PlaylistCueEvent>> dictionary = new Dictionary<Guid, List<PlaylistCueEvent>>();
		if (name != null)
		{
			name = name.TrimStart('.', ' ').Trim();
		}
		Utils.ValidateNullOrEmpty(name, "show name", "Catalog");
		try
		{
			using DBConnection dBConnection = new DBConnection();
			Show show = null;
			show = ((!id.IsNullOrWhiteSpace()) ? new Show(new Guid(id)) : new Show());
			show.Name = name;
			if (Qube.DAL.Show.IsDuplicateName(dBConnection, show.Name, show))
			{
				Diagnostics.LogError($"Show '{name}' name already exists.");
				throw new SoapException(Resources.Common.showNameAlreadyExists, Win32ErrorCode.ErrorAlreadyExists, Resources.Common.showNameAlreadyExists, base.Context, "Catalog");
			}
			Events events = new Events();
			if (eventInfos != null && eventInfos.Length > 0)
			{
				foreach (EventInfo eventInfo in eventInfos)
				{
					Event obj = null;
					if (eventInfo.Type.ToUpper() == EventTypes.PlayTrackEvent)
					{
						PlayEvent playEvent = new PlayEvent(new Guid(eventInfo.ID));
						playEvent.Track = Qube.DAL.Track.GetTrack(dBConnection, new Guid(eventInfo.ContentID));
						obj = playEvent;
					}
					else if (eventInfo.Type.ToUpper() == EventTypes.PlayTitleEvent)
					{
						PlayTitleEvent playTitleEvent = new PlayTitleEvent(new Guid(eventInfo.ID));
						playTitleEvent.Title = Qube.DAL.Title.GetTitle(dBConnection, new Guid(eventInfo.ContentID));
						obj = playTitleEvent;
						Qube.DAL.PlaylistCueEvent.DeleteByParent(dBConnection, playTitleEvent.Id);
						Qube.DAL.TriggerCueEvent.DeleteByParent(dBConnection, playTitleEvent.Id);
					}
					else
					{
						if (!(eventInfo.Type.ToUpper() == EventTypes.CallPlaylistEvent))
						{
							if (eventInfo.Type.ToUpper() == EventTypes.TriggerCueEvent)
							{
								TriggerCueEvent triggerCueEvent = new TriggerCueEvent(new Guid(eventInfo.ID));
								triggerCueEvent.Action = null;
								if (eventInfo.Action == "wait for panel key")
								{
									triggerCueEvent.IsInfinite = true;
								}
								else if (eventInfo.Action == "wait for duration")
								{
									triggerCueEvent.WaitDuration = eventInfo.Duration;
								}
								else if (eventInfo.Action == "wait for ext trigger")
								{
									triggerCueEvent.Action = eventInfo.Trigger;
									triggerCueEvent.IsInfinite = true;
								}
								Timecode timecode = new Timecode(1000m, 0);
								timecode.SetHMSF(eventInfo.Offset);
								triggerCueEvent.Offset = timecode.Seconds;
								triggerCueEvent.Kind = eventInfo.Kind;
								triggerCueEvent.Parent = new Guid(eventInfo.Parent);
								Qube.DAL.Event.Save(dBConnection, triggerCueEvent);
							}
							else if (eventInfo.Type.ToUpper() == EventTypes.PlaylistCueEvent)
							{
								PlaylistCueEvent playlistCueEvent = new PlaylistCueEvent(new Guid(eventInfo.ID));
								playlistCueEvent.Action = eventInfo.Action;
								Timecode timecode2 = new Timecode(1000m, 0);
								timecode2.SetHMSF(eventInfo.Offset);
								playlistCueEvent.Offset = timecode2.Seconds;
								playlistCueEvent.Kind = eventInfo.Kind;
								playlistCueEvent.Parent = new Guid(eventInfo.Parent);
								if (dictionary.ContainsKey(new Guid(eventInfo.Parent)))
								{
									List<PlaylistCueEvent> list = dictionary[new Guid(eventInfo.Parent)];
									list.Add(playlistCueEvent);
								}
								else
								{
									List<PlaylistCueEvent> list = new List<PlaylistCueEvent>();
									list.Add(playlistCueEvent);
									dictionary.Add(new Guid(eventInfo.Parent), list);
								}
								Qube.DAL.Event.Save(dBConnection, playlistCueEvent);
							}
							continue;
						}
						CallPlaylistEvent callPlaylistEvent = new CallPlaylistEvent(new Guid(eventInfo.ID));
						callPlaylistEvent.Playlist = Qube.DAL.Playlist.GetPlaylist(dBConnection, new Guid(eventInfo.ContentID));
						obj = callPlaylistEvent;
						Qube.DAL.PlaylistCueEvent.DeleteByParent(dBConnection, callPlaylistEvent.Id);
						Qube.DAL.TriggerCueEvent.DeleteByParent(dBConnection, callPlaylistEvent.Id);
					}
					events.Add(obj);
				}
			}
			show.Events = events;
			try
			{
				dBConnection.BeginTran();
				if (Qube.DAL.PlaylistTemplate.Get(dBConnection, show.ID) != null)
				{
					Qube.DAL.PlaylistTemplate.Delete(dBConnection, show.ID);
				}
				if (show.HasInlinePlaylist())
				{
					PlaylistTemplate playlistTemplate = new PlaylistTemplate();
					playlistTemplate.Id = show.ID;
					playlistTemplate.Template = show.Serialize();
					PlaylistTemplate playlistTemplate2 = playlistTemplate;
					Qube.DAL.PlaylistTemplate.Save(dBConnection, playlistTemplate2);
					show.RemoveInlinePlaylists();
				}
				Show show2 = Qube.DAL.Show.GetShow(dBConnection, show.ID);
				Qube.DAL.Show.Save(dBConnection, show);
				dBConnection.Commit();
				_SaveShowPlaylist(show, dictionary);
				if (show2 == null)
				{
					Diagnostics.LogInfo(show.Name + " created successfully.");
				}
				else if (string.Equals(show.Name, show2.Name, StringComparison.OrdinalIgnoreCase))
				{
					Diagnostics.LogInfo(show.Name + " updated successfully.");
				}
				else
				{
					Diagnostics.LogInfo($"Show '{show2.Name}' renamed with '{show.Name}' and updated successfully.");
				}
			}
			catch (Exception)
			{
				dBConnection.RollBack();
				throw;
			}
			return show.ID.ToString();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public string GetVersion()
	{
		try
		{
			return Qube.DAL.Catalog.GetProductVersion();
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}

	[WebMethod(Description = "This method has been deprecated", EnableSession = true)]
	public string GetUserGroup()
	{
		try
		{
			string text = QubeCinema.Boys.Common.GetUserGroup().ToString().ToLower();
			if (base.Session != null && base.Session["UserGroup"] == null)
			{
				base.Session["UserGroup"] = text;
				Diagnostics.LogDebug("User logged in as " + text);
			}
			string name = WindowsIdentity.GetCurrent().Name;
			if (base.Session != null && base.Session["Name"] == null)
			{
				base.Session["Name"] = name;
				Diagnostics.LogDebug(name + " has logged in.");
			}
			return text;
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public bool IsEventExists(string playlistID, string eventID)
	{
		Utils.ValidateNullOrEmpty(playlistID, "playlist id", "Catalog");
		Utils.ValidateNullOrEmpty(eventID, "event id", "Catalog");
		try
		{
			using DBConnection connection = new DBConnection();
			Guid guid = new Guid(playlistID);
			if (!Qube.DAL.Playlist.IsExists(connection, guid))
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.playlist, guid);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			return Qube.DAL.Playlist.IsEventExists(connection, guid, new Guid(eventID));
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public string GetReferredPlayList(string titleId)
	{
		Utils.ValidateNullOrEmpty(titleId, "title id", "Catalog");
		try
		{
			using DBConnection conxn = new DBConnection();
			if (_IsTitleProtected(conxn, new Guid(titleId)))
			{
				return $"{titleId} is protected";
			}
			return _GetReferredPlayList(conxn, titleId);
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public string[] GetReferredPlayLists(string[] titleIds)
	{
		try
		{
			Utils.ValidateNullOrEmpty(titleIds, "title(s)", "Catalog");
			List<string> list = new List<string>();
			using (DBConnection conxn = new DBConnection())
			{
				for (int i = 0; i < titleIds.Length; i++)
				{
					Utils.ValidateNullOrEmpty(titleIds[i], "title id", "Catalog");
					if (_IsTitleProtected(conxn, new Guid(titleIds[i])))
					{
						list.Add(titleIds[i]);
					}
					else if (_GetReferredPlayList(conxn, titleIds[i]) != null)
					{
						list.Add(titleIds[i]);
					}
				}
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
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public void ProtectTitle(Guid titleID, bool protect)
	{
		try
		{
			using DBConnection connection = new DBConnection();
			if (!Qube.DAL.Title.IsExists(connection, titleID, isAllEntities: false))
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.title, titleID);
				Diagnostics.LogError($"Title '{titleID}' not found.");
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			Title title = Qube.DAL.Title.GetTitle(connection, titleID);
			Diagnostics.LogInfo(string.Format("Title '{0}' marked as {1}.", title.Name, protect ? "protected" : "unprotected"));
			Qube.DAL.TitleDetails.SetTitleProtect(connection, titleID, protect, null);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	[ScriptMethod(ResponseFormat = ResponseFormat.Xml)]
	public XmlElement GetRecentEvents(int endIndex, string injestLog, string playLog)
	{
		using EventLog eventLog = Logger.GetEventlog();
		try
		{
			DataTable dataTable = new DataTable("RecentEntries");
			dataTable.Columns.Add(new DataColumn("Message"));
			dataTable.Columns.Add(new DataColumn("ErrorType"));
			dataTable.Columns.Add(new DataColumn("TotalEntries"));
			dataTable.Columns.Add(new DataColumn("InjestLog"));
			dataTable.Columns.Add(new DataColumn("PlayLog"));
			if (injestLog == null || injestLog == string.Empty)
			{
				injestLog = DateTime.Today.Date.ToString(CultureInfo.CurrentCulture.DateTimeFormat);
			}
			if (playLog == null || playLog == string.Empty)
			{
				playLog = DateTime.Today.Date.ToString(CultureInfo.CurrentCulture.DateTimeFormat);
			}
			for (int num = eventLog.Entries.Count - 1; num >= endIndex; num--)
			{
				System.Diagnostics.EventLogEntry eventLogEntry = eventLog.Entries[num];
				if (!(new DateTime(eventLogEntry.TimeWritten.Year, eventLogEntry.TimeWritten.Month, eventLogEntry.TimeWritten.Day) == DateTime.Today))
				{
					break;
				}
				if (eventLogEntry.EntryType != EventLogEntryType.Information && eventLogEntry.EntryType.ToString() != "0" && (!(eventLogEntry.Source == "Usher") || eventLogEntry.EntryType != EventLogEntryType.SuccessAudit))
				{
					dataTable.Rows.Add(eventLogEntry.Message, eventLogEntry.EntryType.ToString(), eventLog.Entries.Count, injestLog, playLog);
				}
			}
			dataTable = GetRecentlyIngestedEntities(dataTable, eventLog.Entries.Count, injestLog, playLog);
			StringWriter stringWriter = new StringWriter();
			dataTable.WriteXml(stringWriter, XmlWriteMode.WriteSchema, writeHierarchy: false);
			XmlDocument xmlDocument = new XmlDocument();
			xmlDocument.LoadXml(stringWriter.ToString());
			return xmlDocument.DocumentElement;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public DataTable GetRecentlyIngestedEntities(DataTable dt, int totalEntries, string injestLog, string playLog)
	{
		try
		{
			using DBConnection c = new DBConnection();
			DataSet dataSet = SqlHelper.ExecuteDataset(c, "GetRecentlyIngestedEntities", ConfigurationManager.AppSettings.Get("RowsRequired"), injestLog);
			string text = injestLog;
			for (int i = 0; i < dataSet.Tables[0].Rows.Count; i++)
			{
				text = Convert.ToDateTime(dataSet.Tables[0].Rows[i]["StartTime"], CultureInfo.CurrentCulture.DateTimeFormat).ToString("dd/MMM/yyyy hh:mm:ss.fff tt", CultureInfo.InvariantCulture);
				dt.Rows.Add(dataSet.Tables[0].Rows[i]["ObjectName"].ToString(), dataSet.Tables[0].Rows[i]["Status"].ToString(), totalEntries, text, playLog);
			}
			return GetRecentlyPlayedEntities(dt, totalEntries, text, playLog);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public DataTable GetRecentlyPlayedEntities(DataTable dt, int totalEntries, string injestLog, string playLog)
	{
		try
		{
			Guid guid = Guid.Empty;
			PlayerClient playerClient = Utils.GetPlayerClient();
			if (playerClient != null)
			{
				using (playerClient)
				{
					PlaybackInfo playbackInfo = playerClient.Player.GetPlaybackInfo();
					if (playbackInfo.PlaylistId != guid.ToString() && (playbackInfo.State == PlaybackState.Play || playbackInfo.State == PlaybackState.Pause))
					{
						guid = new Guid(playbackInfo.PlaylistId);
					}
				}
			}
			using DBConnection c = new DBConnection();
			DataSet dataSet = SqlHelper.ExecuteDataset(c, "GetRecentlyPlayedEntities", playLog, guid);
			for (int i = 0; i < dataSet.Tables[0].Rows.Count; i++)
			{
				string text = Convert.ToDateTime(dataSet.Tables[0].Rows[i]["StartTime"], CultureInfo.CurrentCulture.DateTimeFormat).ToString("dd/MMM/yyyy hh:mm:ss.fff tt", CultureInfo.InvariantCulture);
				dt.Rows.Add(dataSet.Tables[0].Rows[i]["Name"].ToString(), dataSet.Tables[0].Rows[i]["Status"].ToString(), totalEntries, injestLog, text);
			}
			return dt;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public void SetTitlesProtect(Guid[] titles, bool isProtect, string validTill)
	{
		Utils.ValidateNullOrEmpty(titles, "title(s)", "Catalog");
		try
		{
			using DBConnection connection = new DBConnection();
			StringBuilder stringBuilder = new StringBuilder();
			stringBuilder.AppendFormat("Following titles are marked as {0} ", isProtect ? "protected" : "unprotected");
			if (!string.IsNullOrEmpty(validTill))
			{
				stringBuilder.AppendFormat(" until {0}.\n", validTill);
			}
			else
			{
				stringBuilder.Append(".\n");
			}
			foreach (Guid guid in titles)
			{
				if (!Qube.DAL.Title.IsExists(connection, guid, isAllEntities: false))
				{
					string text = string.Format(Resources.Common.objectNotFound, Resources.Common.title, guid);
					Diagnostics.LogError($"Title '{guid}' not found.");
					throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
				}
				Title title = Qube.DAL.Title.GetTitle(connection, guid);
				stringBuilder.AppendFormat("{0}\n", title.Name);
				Qube.DAL.TitleDetails.SetTitleProtect(connection, guid, isProtect, validTill);
			}
			Diagnostics.LogInfo(stringBuilder.ToString());
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public List<EssenceType> GetEssenceTypes()
	{
		try
		{
			using DBConnection conxn = new DBConnection();
			return Qube.DAL.MediaFile.GetEssenceTypes(conxn);
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public void DeleteSchedule(string scheduleUUID)
	{
		Utils.ValidateNullOrEmpty(scheduleUUID, "schedule id", "Catalog");
		if (!Utils.IsValidUUID(scheduleUUID))
		{
			throw SoapException.GetInvalidUUIDFormatException("Catalog");
		}
		try
		{
			using DBConnection connection = new DBConnection();
			if (!Qube.DAL.ShowSchedule.IsExists(connection, new Guid(scheduleUUID)))
			{
				Diagnostics.LogError($"Schedule '{scheduleUUID}' not exists");
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.schedule, scheduleUUID);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			ShowSchedule showSchedule = Qube.DAL.ShowSchedule.GetShowSchedule(connection, new Guid(scheduleUUID));
			Qube.DAL.ShowSchedule.Delete(connection, new Guid(scheduleUUID));
			Diagnostics.LogInfo($"Show '{showSchedule.Show.Name}' scheduled at {showSchedule.StartTime.ToLongDateString()} {showSchedule.StartTime.ToLongTimeString()} deleted successfully");
			try
			{
				ITaskManager velaikaran = Utils.GetVelaikaran();
				velaikaran.NotifyScheduler();
			}
			catch (InvalidOperationException ex)
			{
				Diagnostics.LogError(ex.ToString());
			}
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public ShowSchedule GetShowSchedule(string scheduleUUID)
	{
		if (!Utils.IsValidUUID(scheduleUUID))
		{
			throw SoapException.GetInvalidUUIDFormatException("Catalog");
		}
		try
		{
			using DBConnection connection = new DBConnection();
			if (!Qube.DAL.ShowSchedule.IsExists(connection, new Guid(scheduleUUID)))
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.schedule, scheduleUUID);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			ShowSchedule showSchedule = Qube.DAL.ShowSchedule.GetShowSchedule(connection, new Guid(scheduleUUID));
			if (showSchedule != null && showSchedule.Show != null)
			{
				showSchedule.Show = new Show(showSchedule.Show.ID)
				{
					Name = showSchedule.Show.Name
				};
			}
			return showSchedule;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public ShowSchedules GetShowSchedules(DateTime startTime, DateTime endTime)
	{
		try
		{
			using DBConnection connection = new DBConnection();
			ShowSchedules showSchedules = Qube.DAL.ShowSchedule.GetShowSchedules(connection, startTime, endTime);
			IShowScheduleEnumerator enumerator = showSchedules.GetEnumerator();
			try
			{
				while (enumerator.MoveNext())
				{
					ShowSchedule current = enumerator.Current;
					current.Show = new Show(current.Show.ID)
					{
						Name = current.Show.Name
					};
				}
			}
			finally
			{
				if (enumerator is IDisposable disposable)
				{
					disposable.Dispose();
				}
			}
			return showSchedules;
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public void DeleteShow(string id)
	{
		new Usher().DeleteAsset(new Guid(id), AssetType.SPL);
	}

	[WebMethod]
	public void SetProperty(Guid propertyId, string value)
	{
		try
		{
			using DBConnection dBConnection = new DBConnection();
			if (!Qube.DAL.Property.IsExists(dBConnection, propertyId))
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.property, propertyId);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Catalog");
			}
			Qube.XP.PropertyValue propertyValue = null;
			if (Qube.XP.Properties.Subtitling.ID == propertyId)
			{
				propertyValue = Qube.DAL.Property.GetProperty(dBConnection, propertyId);
				propertyValue.Time = DateTime.Now;
				propertyValue.Value = value;
				Qube.DAL.Property.Update(dBConnection, propertyValue);
			}
			else
			{
				Qube.XP.Property property = new Qube.XP.Property();
				property.ID = propertyId;
				propertyValue = new Qube.XP.PropertyValue();
				propertyValue.Property = property;
				propertyValue.Time = DateTime.Now;
				propertyValue.Value = value;
				Qube.DAL.Property.Save(dBConnection, propertyValue);
			}
			Diagnostics.LogInfo($"Property: {propertyId}, Value: {value} saved successfully");
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			string arg = $"Error occured while saving Property '{propertyId}' with Value '{value}'";
			Diagnostics.LogError($"{arg} \n\n{ex2.ToString()}");
			throw new SoapException($"{arg} \n\n{ex2.Message}", ex2, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public Qube.XP.PropertyValue[] GetProperties(Guid?[] properties, DateTime? time)
	{
		try
		{
			using DBConnection conxn = new DBConnection();
			return Qube.DAL.Property.GetProperties(conxn, properties, time);
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public Qube.XP.PropertyValue[] GetPropertiesByPlaylog(Guid?[] properties, Guid playlogId)
	{
		try
		{
			using DBConnection conxn = new DBConnection();
			return Qube.DAL.Property.GetProperties(conxn, properties, playlogId);
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}

	[WebMethod]
	public RAIDInfo GetRAIDStatus()
	{
		try
		{
			ITaskManager velaikaran = Utils.GetVelaikaran();
			if (velaikaran == null)
			{
				RAIDInfo rAIDInfo = new RAIDInfo();
				rAIDInfo.Status = RAIDStatus.Unknown;
				return rAIDInfo;
			}
			return velaikaran.GetRAIDStatus();
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Catalog");
		}
	}
}
