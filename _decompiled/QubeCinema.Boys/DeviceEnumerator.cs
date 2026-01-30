using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using Microsoft.Win32;

namespace QubeCinema.Boys;

public class DeviceEnumerator
{
	[StructLayout(LayoutKind.Sequential)]
	private class SP_DEVINFO_DATA
	{
		public int cbSize;

		public Guid ClassGuid;

		public int DevInst;

		public ulong Reserved;
	}

	private const int DIGCF_PRESENT = 2;

	private const int MAX_DEV_LEN = 1000;

	private const int SPDRP_FRIENDLYNAME = 12;

	private const int SPDRP_DEVICEDESC = 0;

	private const int SPDRP_DRIVER = 9;

	private const int DIGCF_ALLCLASSES = 4;

	[DllImport("setupapi.dll")]
	private static extern bool SetupDiClassGuidsFromNameA(string ClassN, ref Guid guids, uint ClassNameSize, ref uint ReqSize);

	[DllImport("setupapi.dll")]
	private static extern IntPtr SetupDiGetClassDevsA(ref Guid ClassGuid, uint Enumerator, IntPtr hwndParent, uint Flags);

	[DllImport("setupapi.dll")]
	private static extern bool SetupDiEnumDeviceInfo(IntPtr DeviceInfoSet, uint MemberIndex, SP_DEVINFO_DATA DeviceInfoData);

	[DllImport("setupapi.dll")]
	private static extern bool SetupDiDestroyDeviceInfoList(IntPtr DeviceInfoSet);

	[DllImport("setupapi.dll")]
	private static extern bool SetupDiGetDeviceRegistryPropertyA(IntPtr DeviceInfoSet, SP_DEVINFO_DATA DeviceInfoData, uint Property, uint PropertyRegDataType, StringBuilder PropertyBuffer, uint PropertyBufferSize, IntPtr RequiredSize);

	public static string[] GetDeviceNames(string className)
	{
		int num = 0;
		int num2 = -1;
		StringBuilder stringBuilder = new StringBuilder();
		ArrayList arrayList = new ArrayList();
		while (num != -1)
		{
			num = EnumerateDevices((uint)(++num2), className, stringBuilder);
			if (num != -1)
			{
				arrayList.Add(stringBuilder.ToString());
			}
		}
		return arrayList.ToArray(Type.GetType("System.String")) as string[];
	}

	public static string GetDriverInformation()
	{
		string arg = "SYSTEM\\CurrentControlSet\\Control\\Class";
		List<string> list = new List<string>();
		StringBuilder stringBuilder = new StringBuilder();
		Guid ClassGuid = Guid.Empty;
		IntPtr deviceInfoSet = SetupDiGetClassDevsA(ref ClassGuid, 0u, IntPtr.Zero, 6u);
		if (deviceInfoSet.ToInt32() == -1)
		{
			throw new Exception("Invalid Handle");
		}
		SP_DEVINFO_DATA sP_DEVINFO_DATA = new SP_DEVINFO_DATA();
		sP_DEVINFO_DATA.cbSize = 28;
		sP_DEVINFO_DATA.DevInst = 0;
		sP_DEVINFO_DATA.ClassGuid = Guid.Empty;
		sP_DEVINFO_DATA.Reserved = 0uL;
		StringBuilder stringBuilder2 = new StringBuilder("");
		stringBuilder2.Capacity = 1000;
		for (uint num = 0u; SetupDiEnumDeviceInfo(deviceInfoSet, num, sP_DEVINFO_DATA); num++)
		{
			SetupDiGetDeviceRegistryPropertyA(deviceInfoSet, sP_DEVINFO_DATA, 9u, 0u, stringBuilder2, 1000u, IntPtr.Zero);
			if (!list.Contains(stringBuilder2.ToString()))
			{
				list.Add(stringBuilder2.ToString());
				RegistryKey registryKey = Registry.LocalMachine.OpenSubKey($"{arg}\\{stringBuilder2}");
				if (registryKey != null && registryKey.GetValue("DriverDesc") != null)
				{
					stringBuilder.AppendLine(string.Format("Device Name: {0}", registryKey.GetValue("DriverDesc")));
					stringBuilder.AppendLine(string.Format("Provider Name: {0}", registryKey.GetValue("ProviderName")));
					stringBuilder.AppendLine(string.Format("Driver Version: {0}", registryKey.GetValue("DriverVersion")));
					stringBuilder.AppendLine(string.Format("Driver Date: {0}", registryKey.GetValue("DriverDate")));
					stringBuilder.Append("\r\n");
				}
			}
		}
		return stringBuilder.ToString();
	}

	private static int EnumerateDevices(uint DeviceIndex, string ClassName, StringBuilder DeviceName)
	{
		uint ReqSize = 0u;
		_ = Guid.Empty;
		Guid[] array = new Guid[1];
		SP_DEVINFO_DATA sP_DEVINFO_DATA = new SP_DEVINFO_DATA();
		bool flag = SetupDiClassGuidsFromNameA(ClassName, ref array[0], ReqSize, ref ReqSize);
		if (ReqSize == 0)
		{
			DeviceName = new StringBuilder("");
			return -2;
		}
		if (!flag)
		{
			array = new Guid[ReqSize];
			if (!SetupDiClassGuidsFromNameA(ClassName, ref array[0], ReqSize, ref ReqSize) || ReqSize == 0)
			{
				DeviceName = new StringBuilder("");
				return -2;
			}
		}
		IntPtr deviceInfoSet = SetupDiGetClassDevsA(ref array[0], 0u, IntPtr.Zero, 2u);
		if (deviceInfoSet.ToInt32() == -1)
		{
			DeviceName = new StringBuilder("");
			return -3;
		}
		sP_DEVINFO_DATA.cbSize = 28;
		sP_DEVINFO_DATA.DevInst = 0;
		sP_DEVINFO_DATA.ClassGuid = Guid.Empty;
		sP_DEVINFO_DATA.Reserved = 0uL;
		if (!SetupDiEnumDeviceInfo(deviceInfoSet, DeviceIndex, sP_DEVINFO_DATA))
		{
			SetupDiDestroyDeviceInfoList(deviceInfoSet);
			DeviceName = new StringBuilder("");
			return -1;
		}
		DeviceName.Capacity = 1000;
		if (!SetupDiGetDeviceRegistryPropertyA(deviceInfoSet, sP_DEVINFO_DATA, 12u, 0u, DeviceName, 1000u, IntPtr.Zero) && !SetupDiGetDeviceRegistryPropertyA(deviceInfoSet, sP_DEVINFO_DATA, 0u, 0u, DeviceName, 1000u, IntPtr.Zero))
		{
			SetupDiDestroyDeviceInfoList(deviceInfoSet);
			DeviceName = new StringBuilder("");
			return -4;
		}
		return 0;
	}
}
