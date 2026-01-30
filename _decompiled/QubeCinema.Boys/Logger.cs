using System.Diagnostics;

namespace QubeCinema.Boys;

public class Logger
{
	public static string EventlogName => "Qube";

	public static EventLog GetEventlog(string source)
	{
		string logName = EventlogName;
		if (EventLog.SourceExists(source))
		{
			logName = EventLog.LogNameFromSourceName(source, ".");
		}
		EventLog eventLog = new EventLog(logName);
		eventLog.Source = source;
		return eventLog;
	}

	public static EventLog GetEventlog()
	{
		return new EventLog(EventlogName);
	}

	public static void Log(EventLog eventLog, string message, EventLogEntryType entryType)
	{
		if (message.Length > 32000)
		{
			string text = "Continue next log...";
			string text2 = message;
			int num = 32000 - text.Length - 2;
			while (message.Length > 32000)
			{
				text2 = message.Substring(0, num);
				message = message.Remove(0, num);
				eventLog.WriteEntry($"{text2}\n\n{text}", entryType);
			}
		}
		eventLog.WriteEntry(message, entryType);
	}

	public static void Log(string sourceName, string message, EventLogEntryType entryType)
	{
		string logName = EventlogName;
		if (EventLog.SourceExists(sourceName))
		{
			logName = EventLog.LogNameFromSourceName(sourceName, ".");
		}
		using EventLog eventLog = new EventLog(logName);
		eventLog.Source = sourceName;
		Log(eventLog, message, entryType);
	}
}
