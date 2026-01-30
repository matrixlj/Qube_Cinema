using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Linq;
using System.Web.Script.Services;
using System.Web.Services;
using System.Xml.Serialization;
using Qube.Contracts;
using Qube.DAL;
using QubeCinema.Boys;

namespace Qube.Mama;

[WebService(Namespace = "http://webservices.qubecinema.com/XP/Logs/2009-5-8/")]
[ScriptService]
[WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
public class LogService : WebService
{
	private List<Qube.Contracts.EventLogEntry> _GetLogEntries(string source, EventLogEntryType? type, DateTime start, DateTime end)
	{
		try
		{
			if (base.Session != null && source == Logger.EventlogName && base.Session["QubeLogEntries"] != null)
			{
				return (List<Qube.Contracts.EventLogEntry>)base.Session["QubeLogEntries"];
			}
			if (base.Session != null && source == "System" && base.Session["SystemLogEntries"] != null)
			{
				return (List<Qube.Contracts.EventLogEntry>)base.Session["SystemLogEntries"];
			}
			List<Qube.Contracts.EventLogEntry> list = new List<Qube.Contracts.EventLogEntry>();
			using (EventLog eventLog = new EventLog(source))
			{
				end = end.AddHours(24.0);
				System.Diagnostics.EventLogEntry[] array = new System.Diagnostics.EventLogEntry[eventLog.Entries.Count];
				eventLog.Entries.CopyTo(array, 0);
				IEnumerable<System.Diagnostics.EventLogEntry> enumerable = from ieEventLogEntry in array
					where ieEventLogEntry.TimeWritten >= start && ieEventLogEntry.TimeWritten <= end && (!type.HasValue || ieEventLogEntry.EntryType == type)
					orderby ieEventLogEntry.TimeWritten descending
					select ieEventLogEntry;
				foreach (System.Diagnostics.EventLogEntry item in enumerable)
				{
					Qube.Contracts.EventLogEntry eventLogEntry = new Qube.Contracts.EventLogEntry();
					eventLogEntry.Category = item.Category;
					if (item.EntryType == (EventLogEntryType)0)
					{
						eventLogEntry.EntryType = EventLogEntryType.Information;
					}
					else
					{
						eventLogEntry.EntryType = item.EntryType;
					}
					eventLogEntry.EventID = item.InstanceId;
					eventLogEntry.MachineName = item.MachineName;
					eventLogEntry.Message = item.Message;
					eventLogEntry.Source = item.Source;
					eventLogEntry.TimeWritten = item.TimeWritten;
					eventLogEntry.UserName = item.UserName;
					list.Add(eventLogEntry);
				}
			}
			if (base.Session != null)
			{
				if (source == Logger.EventlogName)
				{
					base.Session["QubeLogEntries"] = list;
				}
				else if (source == "System")
				{
					base.Session["SystemLogEntries"] = list;
				}
			}
			return list;
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Logs");
		}
	}

	[WebMethod(EnableSession = true)]
	public List<Qube.Contracts.EventLogEntry> GetLogEntries(string source, DateTime start, DateTime end)
	{
		return _GetLogEntries(source, null, start, end);
	}

	[WebMethod(EnableSession = true)]
	public List<Qube.Contracts.EventLogEntry> GetLogEntriesByType(string source, EventLogEntryType type, DateTime start, DateTime end)
	{
		return _GetLogEntries(source, type, start, end);
	}

	[WebMethod(EnableSession = true)]
	public List<IngestLogEntry> GetIngestLogEntries(DateTime start, DateTime end)
	{
		try
		{
			if (base.Session != null && base.Session["ingestLogEntries"] != null)
			{
				return (List<IngestLogEntry>)base.Session["ingestLogEntries"];
			}
			List<IngestLogEntry> list = new List<IngestLogEntry>();
			using DBConnection c = new DBConnection();
			DataSet dataSet = SqlHelper.ExecuteDataset(c, "GetIngestLogEntries", start, end);
			for (int i = 0; i < dataSet.Tables[0].Rows.Count; i++)
			{
				IngestLogEntry ingestLogEntry = new IngestLogEntry();
				ingestLogEntry.Name = dataSet.Tables[0].Rows[i][0].ToString();
				ingestLogEntry.Type = dataSet.Tables[0].Rows[i][1].ToString();
				ingestLogEntry.StartTime = dataSet.Tables[0].Rows[i][2].ToString();
				ingestLogEntry.EndTime = dataSet.Tables[0].Rows[i][3].ToString();
				ingestLogEntry.Status = dataSet.Tables[0].Rows[i][4].ToString();
				list.Add(ingestLogEntry);
			}
			if (base.Session != null)
			{
				base.Session["ingestLogEntries"] = list;
			}
			return list;
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Logs");
		}
	}

	[WebMethod(EnableSession = true)]
	public void ClearSession()
	{
		try
		{
			if (base.Session != null)
			{
				if (base.Session["playLogEntries"] != null)
				{
					base.Session.Remove("playLogEntries");
				}
				if (base.Session["ingestLogEntries"] != null)
				{
					base.Session.Remove("ingestLogEntries");
				}
				if (base.Session["QubeLogEntries"] != null)
				{
					base.Session.Remove("QubeLogEntries");
				}
				if (base.Session["SystemLogEntries"] != null)
				{
					base.Session.Remove("SystemLogEntries");
				}
			}
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
		}
	}

	[XmlInclude(typeof(PlayLogEntry))]
	[WebMethod(EnableSession = true)]
	public PlaylogLE[] GetPlayLogEntries(DateTime start, DateTime end)
	{
		try
		{
			using DBConnection connection = new DBConnection();
			if (base.Session != null && base.Session["playLogEntries"] != null)
			{
				return (PlaylogLE[])base.Session["playLogEntries"];
			}
			PlaylogLE[] playlogs = LogRetriever.GetPlaylogs(connection, start, end);
			if (playlogs == null)
			{
				Diagnostics.LogDebug("GetPlayLogEntries(): No playlogs for the given period");
				return null;
			}
			if (base.Session != null)
			{
				base.Session["playLogEntries"] = playlogs;
			}
			return playlogs;
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Logs");
		}
	}
}
