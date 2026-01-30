using System;

namespace Qube.Utils.Managed;

public static class DateTimeUtils
{
	public static readonly DateTime UNIX_EPOCH = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);

	public static int GetLocalTimeZoneOffset()
	{
		return (int)TimeZoneInfo.Local.GetUtcOffset(DateTime.Now).TotalMinutes;
	}
}
