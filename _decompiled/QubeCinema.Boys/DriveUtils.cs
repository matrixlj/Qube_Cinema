using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Management;
using System.Runtime.InteropServices;
using System.Text;

namespace QubeCinema.Boys;

public static class DriveUtils
{
	public struct DeviceInfo
	{
		public struct DriveInfo
		{
			public string Path;

			public string DriveLetter;
		}

		public string DeviceId;

		public List<DriveInfo> Drives;
	}

	internal const int DDD_RAW_TARGET_PATH = 1;

	internal const int DDD_REMOVE_DEFINITION = 2;

	internal const int DDD_EXACT_MATCH_ON_REMOVE = 4;

	internal const int DDD_NO_BROADCAST_SYSTEM = 8;

	internal const int DDD_LUID_BROADCAST_DRIVE = 16;

	[DllImport("Kernel32.dll", SetLastError = true)]
	internal static extern bool DefineDosDevice(uint dwflags, string lpDeviceName, string lpTargetPath);

	[DllImport("Kernel32.dll", SetLastError = true)]
	public static extern uint QueryDosDevice(string lpDeviceName, StringBuilder lpTargetPath, uint ucchMax);

	[DllImport("kernel32.dll")]
	public static extern uint GetLastError();

	public static uint Mount(string driveLetter, string targetDevicePath)
	{
		return _Mount(1u, driveLetter, targetDevicePath);
	}

	public static uint Unmount(string driveLetter, string targetDevicePath)
	{
		uint dwFlags = 7u;
		return _Mount(dwFlags, driveLetter, targetDevicePath);
	}

	private static uint _Mount(uint dwFlags, string driveLetter, string targetDevicePath)
	{
		driveLetter = driveLetter.Trim('\\');
		if (DefineDosDevice(dwFlags, driveLetter, targetDevicePath))
		{
			return 0u;
		}
		return GetLastError();
	}

	public static DeviceInfo GetDeviceInfo(string deviceId)
	{
		DeviceInfo result = new DeviceInfo
		{
			DeviceId = deviceId,
			Drives = new List<DeviceInfo.DriveInfo>()
		};
		ManagementObjectCollection managementObjectCollection = new ManagementObjectSearcher("ASSOCIATORS OF {Win32_DiskDrive.DeviceID='" + deviceId + "'} WHERE AssocClass = Win32_DiskDriveToDiskPartition").Get();
		foreach (ManagementBaseObject item2 in managementObjectCollection)
		{
			int num = Convert.ToInt32(item2["Index"].ToString()) + 1;
			DeviceInfo.DriveInfo item = new DeviceInfo.DriveInfo
			{
				DriveLetter = string.Empty,
				Path = string.Format("\\Device\\HardDisk{0}\\Partition{1}", item2["DiskIndex"], num)
			};
			ManagementObjectCollection managementObjectCollection2 = new ManagementObjectSearcher(string.Concat("ASSOCIATORS OF {Win32_DiskPartition.DeviceID='", item2["DeviceID"], "'} WHERE AssocClass = Win32_LogicalDiskToPartition")).Get();
			using (ManagementObjectCollection.ManagementObjectEnumerator managementObjectEnumerator2 = managementObjectCollection2.GetEnumerator())
			{
				if (managementObjectEnumerator2.MoveNext())
				{
					ManagementBaseObject current2 = managementObjectEnumerator2.Current;
					item.DriveLetter = current2["Name"].ToString();
				}
			}
			result.Drives.Add(item);
		}
		return result;
	}

	public static string GetFirstUnusedDrive(char driveLetter)
	{
		string[] logicalDrives = Directory.GetLogicalDrives();
		for (int i = 0; i < logicalDrives.Length; i++)
		{
			if (logicalDrives[i][0].ToString().ToUpper() == driveLetter.ToString().ToUpper())
			{
				driveLetter = (char)(driveLetter + 1);
			}
		}
		return driveLetter + ":\\";
	}

	public static List<DeviceInfo> GetDevicePathsToMount(string deviceId)
	{
		List<DeviceInfo> list = new List<DeviceInfo>();
		try
		{
			string systemDriveLetter = Path.GetPathRoot(Environment.SystemDirectory).TrimEnd('\\');
			ManagementObjectCollection managementObjectCollection = new ManagementObjectSearcher("SELECT * FROM Win32_DiskDrive").Get();
			foreach (ManagementBaseObject item in managementObjectCollection)
			{
				string text = item["DeviceId"].ToString();
				if (deviceId == string.Empty || text == deviceId)
				{
					DeviceInfo deviceInfo = GetDeviceInfo(text);
					if (!deviceInfo.Drives.Any((DeviceInfo.DriveInfo drive) => drive.DriveLetter.StartsWith(systemDriveLetter, StringComparison.OrdinalIgnoreCase)))
					{
						list.Add(deviceInfo);
					}
				}
			}
		}
		catch (Exception)
		{
		}
		return list;
	}

	public static List<string> GetDrivesWithoutRootDir()
	{
		List<string> list = new List<string>();
		ManagementObjectSearcher managementObjectSearcher = new ManagementObjectSearcher("SELECT * FROM Win32_LogicalDisk WHERE DriveType=" + 1);
		foreach (ManagementObject item in managementObjectSearcher.Get())
		{
			list.Add(item["DeviceID"].ToString());
		}
		return list;
	}
}
