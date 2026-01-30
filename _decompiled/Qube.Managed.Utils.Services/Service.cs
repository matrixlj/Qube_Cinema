using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.ServiceProcess;

namespace Qube.Managed.Utils.Services;

public static class Service
{
	private const uint SERVICE_NO_CHANGE = uint.MaxValue;

	private const uint SERVICE_QUERY_CONFIG = 1u;

	private const uint SERVICE_CHANGE_CONFIG = 2u;

	private const uint SC_MANAGER_ALL_ACCESS = 983103u;

	[DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
	public static extern bool ChangeServiceConfig(IntPtr hService, uint nServiceType, uint nStartType, uint nErrorControl, string lpBinaryPathName, string lpLoadOrderGroup, IntPtr lpdwTagId, [In] char[] lpDependencies, string lpServiceStartName, string lpPassword, string lpDisplayName);

	[DllImport("advapi32.dll", CharSet = CharSet.Auto, SetLastError = true)]
	private static extern IntPtr OpenService(IntPtr hSCManager, string lpServiceName, uint dwDesiredAccess);

	[DllImport("advapi32.dll", CharSet = CharSet.Unicode, EntryPoint = "OpenSCManagerW", ExactSpelling = true, SetLastError = true)]
	public static extern IntPtr OpenSCManager(string machineName, string databaseName, uint dwAccess);

	[DllImport("advapi32.dll")]
	public static extern int CloseServiceHandle(IntPtr hSCObject);

	public static void ChangeStartMode(ServiceController svc, ServiceStartMode mode)
	{
		IntPtr intPtr = OpenSCManager(null, null, 983103u);
		if (intPtr == IntPtr.Zero)
		{
			throw new ExternalException("Open Service Manager Error");
		}
		IntPtr intPtr2 = OpenService(intPtr, svc.ServiceName, 3u);
		if (intPtr2 == IntPtr.Zero)
		{
			throw new ExternalException("Open Service Error");
		}
		if (!ChangeServiceConfig(intPtr2, uint.MaxValue, (uint)mode, uint.MaxValue, null, null, IntPtr.Zero, null, null, null, null))
		{
			int lastWin32Error = Marshal.GetLastWin32Error();
			Win32Exception ex = new Win32Exception(lastWin32Error);
			throw new ExternalException($"Could not change service start type: {ex.Message}");
		}
		CloseServiceHandle(intPtr2);
		CloseServiceHandle(intPtr);
	}
}
