using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Web;
using System.Web.Script.Services;
using System.Web.Services;
using Qube.Contracts;
using Qube.DAL;
using Qube.Thrift;
using QubeCinema.Boys;
using Resources;

namespace Qube.Mama;

[WebService(Namespace = "http://webservices.qubecinema.com/XP/Dalapathi/2009-05-28/")]
[ScriptService]
[WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
public class Dalapathi : WebService
{
	public static string DEVICE_ID => "eba12af2-a0fa-4cd1-b8f3-683f4a4e9fdc";

	private SoapException NotImplementedException => new SoapException("Not implemented", new NotImplementedException(), base.Context, "Dalapathi");

	private SoapException PeNotFoundException => new SoapException(Resources.Common.dalapathiNotFound, new InvalidOperationException(Resources.Common.dalapathiNotFound), base.Context, "Dalapathi");

	private DateTime DateTimeNow
	{
		get
		{
			TimeZoneInfo destinationTimeZone = TimeZoneInfo.Utc;
			try
			{
				destinationTimeZone = TimeZoneInfo.FindSystemTimeZoneById(TimeZoneInformation.CurrentTimeZone.Name);
			}
			catch
			{
			}
			return TimeZoneInfo.ConvertTime(DateTime.Now, TimeZoneInfo.Local, destinationTimeZone);
		}
	}

	private string _GetCurrentMonth(CultureInfo cultureInfo)
	{
		return cultureInfo.DateTimeFormat.GetAbbreviatedMonthName(DateTimeNow.Month);
	}

	private void _Play(IPlayer.Client player)
	{
		player.Play(SmsApi.AuthId);
	}

	private PlayerClient _GetPlayerClient()
	{
		PlayerClient playerClient = Utils.GetPlayerClient();
		if (playerClient == null)
		{
			throw PeNotFoundException;
		}
		return playerClient;
	}

	private static double _GetAbortedPosition(DBConnection conxn, Guid playlistId)
	{
		PlaylistPlayInfo lastPlaylistPlayInfo = Qube.DAL.Playlog.GetLastPlaylistPlayInfo(conxn, playlistId);
		if (lastPlaylistPlayInfo == null || lastPlaylistPlayInfo.Offset == -1m)
		{
			return 0.0;
		}
		return Convert.ToDouble(lastPlaylistPlayInfo.Offset);
	}

	[WebMethod]
	public void Connect(int port)
	{
	}

	[WebMethod]
	public CurrentShowInfo GetCurrentShowInfo(string showID, bool isEvents, bool isDurationUpCount, bool isShowEventUpCount)
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			PlaybackInfo playbackInfo = playerClient.Player.GetPlaybackInfo();
			Guid guid = new Guid(playbackInfo.PlaylistId);
			List<Qube.Thrift.Config> configs = playerClient.Player.GetConfigs(new List<string> { ConfigKeys.LoopPlayback });
			bool isLoopplayBack = Convert.ToBoolean(configs[0].Value);
			if (guid == Guid.Empty)
			{
				return new CurrentShowInfo(guid, "", (DalapathiState)playbackInfo.State, Convert.ToDecimal(playbackInfo.Position), DateTime.MinValue, 0m, Guid.Empty, 0m, null, isLoopplayBack, null);
			}
			using DBConnection dBConnection = new DBConnection();
			Playlist playlist = Qube.DAL.Playlist.GetPlaylist(dBConnection, guid);
			if (playlist == null)
			{
				return new CurrentShowInfo(guid, "", (DalapathiState)playbackInfo.State, Convert.ToDecimal(playbackInfo.Position), DateTime.MinValue, 0m, Guid.Empty, 0m, null, isLoopplayBack, null);
			}
			CueLE[] cues = null;
			using (AutomationServiceClient automationServiceClient = new AutomationServiceClient())
			{
				cues = automationServiceClient.GetCurrentPlaylistCues();
			}
			CurrentShowInfo currentShowInfo = new CurrentShowInfo(guid, playlist.Name, (DalapathiState)playbackInfo.State, Convert.ToDecimal(playbackInfo.Position), Convert.ToDateTime(playbackInfo.StartTime), playlist.Duration, new Guid(playbackInfo.EventId), Convert.ToDecimal(playbackInfo.EventPosition), Qube.DAL.Playlist.GetEventsLE(dBConnection, guid).ToArray(), isLoopplayBack, cues);
			if (!isShowEventUpCount && currentShowInfo.ShowEvent != string.Empty)
			{
				Event obj = Qube.DAL.Event.GetEvent(dBConnection, new Guid(currentShowInfo.ShowEvent));
				if (obj != null)
				{
					Timecode timecode = new Timecode(1000m, 0);
					timecode.Seconds = obj.Duration - currentShowInfo.ShowEventPos;
					currentShowInfo.ShowEventPosition = timecode.GetHMS();
				}
			}
			if (isDurationUpCount)
			{
				Timecode timecode2 = new Timecode(1000m, 0);
				timecode2.Seconds = currentShowInfo.Position;
				currentShowInfo.RemainingDuration = timecode2.GetHMS();
			}
			return currentShowInfo;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public string GetCurrentShow()
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			PlaybackInfo playbackInfo = playerClient.Player.GetPlaybackInfo();
			if (playbackInfo.PlaylistId == Guid.Empty.ToString())
			{
				return null;
			}
			return playbackInfo.PlaylistId;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public bool IsShowInUse(Guid showID)
	{
		try
		{
			return GetCurrentShow() == showID.ToString();
		}
		catch
		{
			return false;
		}
	}

	[WebMethod]
	public object GetCurrentPosition(bool isHMS)
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			PlaybackInfo playbackInfo = playerClient.Player.GetPlaybackInfo();
			if (!isHMS)
			{
				return playbackInfo.Position;
			}
			Timecode timecode = new Timecode(1000m, 0);
			timecode.Seconds = Convert.ToDecimal(playbackInfo.Position);
			return timecode.GetHM();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public void SetDeviceMode(bool isScheduled)
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			playerClient.Player.SetConfigs(new List<Qube.Thrift.Config>
			{
				new Qube.Thrift.Config
				{
					Key = ConfigKeys.AutoPlayback,
					Value = isScheduled.ToString()
				}
			});
			Diagnostics.LogInfo(string.Format("Auto playback mode {0}", isScheduled ? "enabled" : "disabled"));
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public void Cue(Guid evnt)
	{
		try
		{
			using (_GetPlayerClient())
			{
			}
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public void Play()
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			if (playerClient.Player.GetPlaybackInfo().State == PlaybackState.Stop)
			{
				using DBConnection database = new DBConnection();
				PlayerApi.ReloadShowIfModified(playerClient, database);
			}
			_Play(playerClient.Player);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (SecurityLogErrorException ex2)
		{
			throw new SoapException(Resources.Common.securityLogErrorMsg, ex2, base.Context, "Dalapathi");
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public void Pause()
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			playerClient.Player.Pause();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public void Stop()
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			playerClient.Player.Stop(SmsApi.AuthId);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public DalapathiState GetState()
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			return (DalapathiState)playerClient.Player.GetPlaybackInfo().State;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public string GetShowEvent()
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			PlaybackInfo playbackInfo = playerClient.Player.GetPlaybackInfo();
			if (playbackInfo.EventId == Guid.Empty.ToString())
			{
				return null;
			}
			return playbackInfo.EventId;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public void LoadShow(Guid id, bool isStereoscopic)
	{
		try
		{
			using (DBConnection dbConnection = new DBConnection())
			{
				Qube.DAL.Show.ExpandInlinePlaylist(dbConnection, id);
			}
			using PlayerClient playerClient = _GetPlayerClient();
			playerClient.Player.LoadPlaylist(id.ToString());
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public void ResumeShow(Guid id, bool isStereoscopic)
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			using DBConnection conxn = new DBConnection();
			playerClient.Player.LoadPlaylist(id.ToString());
			double positionInSeconds = _GetAbortedPosition(conxn, id);
			playerClient.Player.Seek(positionInSeconds, SmsApi.AuthId);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public void Seek(decimal position)
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			playerClient.Player.Seek(Convert.ToDouble(position), SmsApi.AuthId);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public string GetCurrentShowStartTime()
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			return Convert.ToDateTime(playerClient.Player.GetPlaybackInfo().StartTime).ToShortTimeString();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public string GetCurrentShowEndTime(double duration)
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			PlaybackInfo playbackInfo = playerClient.Player.GetPlaybackInfo();
			return DateTime.Now.AddSeconds(duration - playbackInfo.Position).ToShortTimeString();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public string GetDevice()
	{
		try
		{
			using (_GetPlayerClient())
			{
			}
			return DEVICE_ID;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public bool IsDLPCinemaDevice()
	{
		try
		{
			return true;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public bool IsScheduled()
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			List<Qube.Thrift.Config> configs = playerClient.Player.GetConfigs(new List<string> { ConfigKeys.AutoPlayback });
			return Convert.ToBoolean(configs[0].Value);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public string GetCurrentTime()
	{
		try
		{
			CultureInfo cultureInfo = CultureInfo.CurrentCulture;
			if (base.Context != null && base.Context.Request != null && base.Context.Request.UserLanguages != null && base.Context.Request.UserLanguages.Length > 0)
			{
				cultureInfo = CultureInfo.CreateSpecificCulture(base.Context.Request.UserLanguages[0]);
			}
			return DateTimeNow.ToString("hh:mm tt", cultureInfo.DateTimeFormat);
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public string GetLocalTimeDiff()
	{
		try
		{
			TimeZoneInfo timeZoneInfo = TimeZoneInfo.Utc;
			try
			{
				timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(TimeZoneInformation.CurrentTimeZone.Name);
			}
			catch
			{
			}
			TimeSpan utcOffset = timeZoneInfo.GetUtcOffset(DateTimeNow);
			string text = ((utcOffset.Hours >= 0) ? "+" : string.Empty);
			return text + $"{utcOffset.Hours:D2}:{Math.Abs(utcOffset.Minutes):D2}";
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public string GetCurrentDay()
	{
		try
		{
			CultureInfo cultureInfo = CultureInfo.CurrentCulture;
			if (base.Context != null && base.Context.Request != null && base.Context.Request.UserLanguages != null && base.Context.Request.UserLanguages.Length > 0)
			{
				cultureInfo = CultureInfo.CreateSpecificCulture(base.Context.Request.UserLanguages[0]);
			}
			return cultureInfo.DateTimeFormat.GetAbbreviatedDayName(DateTimeNow.DayOfWeek);
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public string GetCurrentMonthAndDate()
	{
		try
		{
			CultureInfo cultureInfo = CultureInfo.CurrentCulture;
			if (base.Context != null && base.Context.Request != null && base.Context.Request.UserLanguages != null && base.Context.Request.UserLanguages.Length > 0)
			{
				cultureInfo = CultureInfo.CreateSpecificCulture(base.Context.Request.UserLanguages[0]);
			}
			return $"{_GetCurrentMonth(cultureInfo)} {DateTimeNow.Day.ToString()}";
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public string GetCurrentYear()
	{
		try
		{
			return DateTimeNow.Year.ToString();
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public ShowStatus IsPlaylistValid(string serialno, string showId)
	{
		try
		{
			if (!Utils.IsValidUUID(showId))
			{
				throw SoapException.GetInvalidUUIDFormatException("Dalapathi");
			}
			using DBConnection dBConnection = new DBConnection();
			Guid guid = new Guid(showId);
			if (!Qube.DAL.Playlist.IsExists(dBConnection, guid))
			{
				Diagnostics.LogError(string.Format(ResourceManager.GetString("objectNotFound"), "playlist", showId));
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.show, showId);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Dalapathi");
			}
			if (Qube.DAL.Playlist.GetEventsID(dBConnection, guid).Count == 0 && Qube.DAL.PlaylistTemplate.Get(dBConnection, guid) != null)
			{
				ShowStatus showStatus = new ShowStatus();
				showStatus.IsPlayable = true;
				return showStatus;
			}
			using PlayerClient playerClient = _GetPlayerClient();
			PlaylistStatus playlistStatus = playerClient.Player.GetPlaylistStatus(showId);
			ShowStatus showStatus2 = new ShowStatus();
			showStatus2.ErrorMessage = playlistStatus.ErrorMessage;
			showStatus2.IsAborted = playlistStatus.IsAborted;
			showStatus2.IsFPS48 = playlistStatus.Has48Fps;
			showStatus2.IsPlayable = playlistStatus.IsPlayable;
			showStatus2.IsStereoscopic = playlistStatus.HasStereoscopic;
			return showStatus2;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public bool IsShowAborted(string serialno, Guid showId)
	{
		try
		{
			using DBConnection connection = new DBConnection();
			if (!Qube.DAL.Playlist.IsExists(connection, showId))
			{
				string text = string.Format(Resources.Common.objectNotFound, Resources.Common.show, showId);
				throw new SoapException(text, Win32ErrorCode.ObjectNotFound, text, base.Context, "Dalapathi");
			}
			PlaylistPlayInfo lastPlaylistPlayInfo = Qube.DAL.Playlog.GetLastPlaylistPlayInfo(connection, showId);
			return lastPlaylistPlayInfo != null && lastPlaylistPlayInfo.Offset > -1m;
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public void SkipBack()
	{
		try
		{
			using PlayerClient client = _GetPlayerClient();
			using DBConnection conxn = new DBConnection();
			PlayerApi.PlayPreviousEvent(client, conxn, SmsApi.AuthId);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public void SkipForward()
	{
		try
		{
			using PlayerClient client = _GetPlayerClient();
			using DBConnection conxn = new DBConnection();
			PlayerApi.PlayNextEvent(client, conxn, SmsApi.AuthId);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public string GetSerialNumber()
	{
		try
		{
			return Utils.GetSerialNumber();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public List<Cue> GetCueList()
	{
		new List<Cue>();
		try
		{
			string[] userLanguages = HttpContext.Current.Request.UserLanguages;
			if (userLanguages != null)
			{
				userLanguages = userLanguages[0].Split(';');
				if (userLanguages != null || userLanguages.Length != 0)
				{
					_ = userLanguages[0];
				}
			}
			Cue[] source = null;
			using (AutomationServiceClient automationServiceClient = new AutomationServiceClient())
			{
				source = automationServiceClient.GetCues();
			}
			return source.ToList();
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public void SetLoopPlayBack(bool isLoopPlayBack)
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			playerClient.Player.SetConfigs(new List<Qube.Thrift.Config>
			{
				new Qube.Thrift.Config
				{
					Key = ConfigKeys.LoopPlayback,
					Value = isLoopPlayBack.ToString()
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
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public void PlayFromPosition(decimal position)
	{
		try
		{
			Seek(position);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (SecurityLogErrorException ex2)
		{
			throw new SoapException(Resources.Common.securityLogErrorMsg, ex2, base.Context, "Dalapathi");
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public void PlayFromEvent(Guid eventId)
	{
		try
		{
			using PlayerClient client = _GetPlayerClient();
			using DBConnection conxn = new DBConnection();
			PlayerApi.PlayFromEvent(client, conxn, eventId, SmsApi.AuthId);
		}
		catch (SoapException)
		{
			throw;
		}
		catch (SecurityLogErrorException ex2)
		{
			throw new SoapException(Resources.Common.securityLogErrorMsg, ex2, base.Context, "Dalapathi");
		}
		catch (Exception ex3)
		{
			Diagnostics.LogError(ex3.ToString());
			throw new SoapException(ex3.Message, ex3, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public void LoadShowByName(string showName)
	{
		try
		{
			Utils.ValidateNullOrEmpty(showName, "show name", "Dalapathi");
			Shows shows = null;
			using (DBConnection connection = new DBConnection())
			{
				shows = Qube.DAL.Show.GetShows(connection);
			}
			IShowEnumerator enumerator = shows.GetEnumerator();
			try
			{
				while (enumerator.MoveNext())
				{
					Playlist current = enumerator.Current;
					if (showName.ToLower() == current.Name.ToLower())
					{
						using (PlayerClient playerClient = _GetPlayerClient())
						{
							playerClient.Player.LoadPlaylist(current.ID.ToString());
							return;
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
			throw new SoapException(Resources.Common.loadShowFailed, new InvalidOperationException($"Show '{showName}' not found"), base.Context, "Dalapathi");
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public string Get3DMode()
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			List<Qube.Thrift.Config> configs = playerClient.Player.GetConfigs(new List<string> { ConfigKeys.ThreeDMode });
			return configs[0].Value;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}

	[WebMethod]
	public string Get3DConfigFile()
	{
		try
		{
			using PlayerClient playerClient = _GetPlayerClient();
			List<Qube.Thrift.Config> configs = playerClient.Player.GetConfigs(new List<string> { ConfigKeys.ThreeDConfigFileName });
			return configs[0].Value;
		}
		catch (SoapException)
		{
			throw;
		}
		catch (Exception ex2)
		{
			Diagnostics.LogError(ex2.ToString());
			throw new SoapException(ex2.Message, ex2, base.Context, "Dalapathi");
		}
	}
}
