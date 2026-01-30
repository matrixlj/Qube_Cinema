using System;
using System.Collections;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;
using Microsoft.Win32;

namespace QubeCinema.Boys;

public class TimeZoneInformation
{
	private class TimeZoneComparer : IComparer
	{
		public int Compare(object x, object y)
		{
			TimeZoneInformation timeZoneInformation = x as TimeZoneInformation;
			TimeZoneInformation timeZoneInformation2 = y as TimeZoneInformation;
			int num = timeZoneInformation.Bias - timeZoneInformation2.Bias;
			if (num == 0)
			{
				return timeZoneInformation.DisplayName.CompareTo(timeZoneInformation2.DisplayName);
			}
			return num;
		}
	}

	public struct SYSTEMTIME
	{
		public ushort wYear;

		public ushort wMonth;

		public ushort wDayOfWeek;

		public ushort wDay;

		public ushort wHour;

		public ushort wMinute;

		public ushort wSecond;

		public ushort wMilliseconds;
	}

	private struct TZI
	{
		public int bias;

		public int standardBias;

		public int daylightBias;

		public SYSTEMTIME standardDate;

		public SYSTEMTIME daylightDate;
	}

	[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
	public struct TIME_ZONE_INFORMATION
	{
		[MarshalAs(UnmanagedType.I4)]
		public int Bias;

		[MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
		public string StandardName;

		public SYSTEMTIME StandardDate;

		[MarshalAs(UnmanagedType.I4)]
		public int StandardBias;

		[MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
		public string DaylightName;

		public SYSTEMTIME DaylightDate;

		[MarshalAs(UnmanagedType.I4)]
		public int DaylightBias;
	}

	[StructLayout(LayoutKind.Sequential, Size = 1)]
	private struct NativeMethods
	{
		private const string KERNEL32 = "kernel32.dll";

		[DllImport("kernel32.dll")]
		public static extern uint GetTimeZoneInformation(out TIME_ZONE_INFORMATION lpTimeZoneInformation);

		[DllImport("kernel32.dll")]
		public static extern bool SetTimeZoneInformation(ref TIME_ZONE_INFORMATION lpTimeZoneInformation);

		[DllImport("kernel32.dll")]
		public static extern bool SystemTimeToTzSpecificLocalTime([In] ref TIME_ZONE_INFORMATION lpTimeZone, [In] ref SYSTEMTIME lpUniversalTime, out SYSTEMTIME lpLocalTime);

		[DllImport("kernel32.dll")]
		public static extern bool SystemTimeToFileTime([In] ref SYSTEMTIME lpSystemTime, out System.Runtime.InteropServices.ComTypes.FILETIME lpFileTime);

		[DllImport("kernel32.dll")]
		public static extern bool FileTimeToSystemTime([In] ref System.Runtime.InteropServices.ComTypes.FILETIME lpFileTime, out SYSTEMTIME lpSystemTime);

		[DllImport("kernel32.dll")]
		public static extern bool TzSpecificLocalTimeToSystemTime([In] ref TIME_ZONE_INFORMATION lpTimeZone, [In] ref SYSTEMTIME lpLocalTime, out SYSTEMTIME lpUniversalTime);
	}

	private static TimeZoneInformation[] s_zones = null;

	private static readonly object s_lockZones = new object();

	private TZI m_tzi;

	private string m_name;

	private string m_displayName;

	private int m_index;

	private string m_standardName;

	private string m_daylightName;

	public static TimeZoneInformation CurrentTimeZone
	{
		get
		{
			TimeZoneInformation[] array = EnumZones();
			NativeMethods.GetTimeZoneInformation(out var lpTimeZoneInformation);
			for (int i = 0; i < array.Length; i++)
			{
				if (array[i].m_tzi.bias == lpTimeZoneInformation.Bias && array[i].m_tzi.standardBias == lpTimeZoneInformation.StandardBias && array[i].m_standardName == lpTimeZoneInformation.StandardName && (array[i].m_tzi.daylightBias == lpTimeZoneInformation.DaylightBias || array[i].m_tzi.standardBias == lpTimeZoneInformation.DaylightBias) && (array[i].m_daylightName == lpTimeZoneInformation.DaylightName || array[i].m_standardName == lpTimeZoneInformation.DaylightName))
				{
					return array[i];
				}
			}
			return null;
		}
		set
		{
			TIME_ZONE_INFORMATION lpTimeZoneInformation = value.TziNative();
			NativeMethods.SetTimeZoneInformation(ref lpTimeZoneInformation);
		}
	}

	public string Name => m_name;

	public string DisplayName => m_displayName;

	public int Index => m_index;

	public string StandardName => m_standardName;

	public string DaylightName => m_daylightName;

	public int Bias => -m_tzi.bias;

	public int StandardBias => -(m_tzi.bias + m_tzi.standardBias);

	public int DaylightBias => -(m_tzi.bias + m_tzi.daylightBias);

	private TimeZoneInformation()
	{
	}

	public static TimeZoneInformation FromIndex(int index)
	{
		TimeZoneInformation[] array = EnumZones();
		for (int i = 0; i < array.Length; i++)
		{
			if (array[i].Index == index)
			{
				return array[i];
			}
		}
		throw new ArgumentOutOfRangeException("index", index, "Unknown time zone index");
	}

	public static TimeZoneInformation[] EnumZones()
	{
		if (s_zones == null)
		{
			lock (s_lockZones)
			{
				if (s_zones == null)
				{
					ArrayList arrayList = new ArrayList();
					using (RegistryKey registryKey = Registry.LocalMachine.OpenSubKey("SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Time Zones"))
					{
						string[] subKeyNames = registryKey.GetSubKeyNames();
						object obj = null;
						string[] array = subKeyNames;
						foreach (string name in array)
						{
							using RegistryKey registryKey2 = registryKey.OpenSubKey(name);
							TimeZoneInformation timeZoneInformation = new TimeZoneInformation();
							timeZoneInformation.m_name = name;
							timeZoneInformation.m_displayName = (string)registryKey2.GetValue("Display");
							timeZoneInformation.m_standardName = (string)registryKey2.GetValue("Std");
							timeZoneInformation.m_daylightName = (string)registryKey2.GetValue("Dlt");
							obj = registryKey2.GetValue("Index");
							if (obj != null)
							{
								timeZoneInformation.m_index = (int)obj;
							}
							timeZoneInformation.InitTzi((byte[])registryKey2.GetValue("Tzi"));
							arrayList.Add(timeZoneInformation);
						}
					}
					s_zones = new TimeZoneInformation[arrayList.Count];
					arrayList.CopyTo(s_zones);
					Array.Sort(s_zones, new TimeZoneComparer());
				}
			}
		}
		return s_zones;
	}

	public override string ToString()
	{
		return m_displayName;
	}

	private void InitTzi(byte[] info)
	{
		if (info.Length != Marshal.SizeOf((object)m_tzi))
		{
			throw new ArgumentException("Information size is incorrect", "info");
		}
		GCHandle gCHandle = GCHandle.Alloc(info, GCHandleType.Pinned);
		try
		{
			m_tzi = (TZI)Marshal.PtrToStructure(gCHandle.AddrOfPinnedObject(), typeof(TZI));
		}
		finally
		{
			gCHandle.Free();
		}
	}

	public TIME_ZONE_INFORMATION TziNative()
	{
		return new TIME_ZONE_INFORMATION
		{
			Bias = m_tzi.bias,
			StandardDate = m_tzi.standardDate,
			StandardBias = m_tzi.standardBias,
			StandardName = m_standardName,
			DaylightDate = m_tzi.daylightDate,
			DaylightBias = m_tzi.daylightBias,
			DaylightName = m_daylightName
		};
	}

	public DateTime FromUniversalTime(DateTime utc)
	{
		SYSTEMTIME lpUniversalTime = DateTimeToSystemTime(utc);
		TIME_ZONE_INFORMATION lpTimeZone = TziNative();
		NativeMethods.SystemTimeToTzSpecificLocalTime(ref lpTimeZone, ref lpUniversalTime, out var lpLocalTime);
		return SystemTimeToDateTime(ref lpLocalTime);
	}

	public static DateTime FromUniversalTime(int index, DateTime utc)
	{
		TimeZoneInformation timeZoneInformation = FromIndex(index);
		return timeZoneInformation.FromUniversalTime(utc);
	}

	public DateTime ToUniversalTime(DateTime local)
	{
		SYSTEMTIME lpLocalTime = DateTimeToSystemTime(local);
		TIME_ZONE_INFORMATION lpTimeZone = TziNative();
		try
		{
			NativeMethods.TzSpecificLocalTimeToSystemTime(ref lpTimeZone, ref lpLocalTime, out var lpUniversalTime);
			return new DateTime(SystemTimeToDateTime(ref lpUniversalTime).Ticks, DateTimeKind.Utc);
		}
		catch (EntryPointNotFoundException innerException)
		{
			throw new NotSupportedException("This method is not supported on this operating system", innerException);
		}
	}

	public static DateTime ToUniversalTime(int index, DateTime local)
	{
		TimeZoneInformation timeZoneInformation = FromIndex(index);
		return timeZoneInformation.ToUniversalTime(local);
	}

	private static SYSTEMTIME DateTimeToSystemTime(DateTime dt)
	{
		System.Runtime.InteropServices.ComTypes.FILETIME lpFileTime = new System.Runtime.InteropServices.ComTypes.FILETIME
		{
			dwHighDateTime = (int)(dt.Ticks >> 32),
			dwLowDateTime = (int)(dt.Ticks & 0xFFFFFFFFu)
		};
		NativeMethods.FileTimeToSystemTime(ref lpFileTime, out var lpSystemTime);
		return lpSystemTime;
	}

	private static DateTime SystemTimeToDateTime(ref SYSTEMTIME st)
	{
		System.Runtime.InteropServices.ComTypes.FILETIME lpFileTime = default(System.Runtime.InteropServices.ComTypes.FILETIME);
		NativeMethods.SystemTimeToFileTime(ref st, out lpFileTime);
		return new DateTime(((long)lpFileTime.dwHighDateTime << 32) | (uint)lpFileTime.dwLowDateTime);
	}
}
