using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using NLog;
using Newtonsoft.Json;

namespace Qube.Web;

public class QubeWebNotifier
{
	public struct MessageInfo
	{
		public string Name;

		public object Params;
	}

	public static class Events
	{
		public const string SHOW_LOADED = "SHOW_LOADED";

		public const string SHOW_EJECTED = "SHOW_EJECTED";

		public const string SHOW_PLAYING = "SHOW_PLAYING";

		public const string SHOW_PAUSED = "SHOW_PAUSED";

		public const string SHOW_STOPPED = "SHOW_STOPPED";

		public const string SHOW_CREATED = "SHOW_CREATED";

		public const string SHOW_DELETED = "SHOW_DELETED";

		public const string SHOW_RENAMED = "SHOW_RENAMED";

		public const string CONFIG_CHANGED = "CONFIG_CHANGED";

		public const string DRIVE_ADDED = "DRIVE_ADDED";

		public const string DRIVE_REMOVED = "DRIVE_REMOVED";
	}

	public static class Params
	{
		public struct Show
		{
			public string ShowId;

			public string ShowName;
		}

		public struct Playback
		{
			public string ShowId;

			public string ShowName;
		}

		public struct Config
		{
			public string Name;

			public string Value;

			public string OldValue;
		}

		public struct DriveInfo
		{
			public string Name;
		}
	}

	private const int QUBE_WEB_NOTIFIER_UDP_PORT = 11000;

	private static Logger _logger = LogManager.GetCurrentClassLogger();

	public static void NotifyEvent(string eventName, object parameters)
	{
		try
		{
			using UdpClient udpClient = new UdpClient();
			IPEndPoint endPoint = new IPEndPoint(IPAddress.Loopback, 11000);
			byte[] bytes = Encoding.ASCII.GetBytes(JsonConvert.SerializeObject((object)new MessageInfo
			{
				Name = eventName,
				Params = parameters
			}));
			udpClient.Connect(endPoint);
			udpClient.Send(bytes, bytes.Length);
		}
		catch (Exception exception)
		{
			_logger.ErrorException("Notify event failed.", exception);
		}
	}
}
