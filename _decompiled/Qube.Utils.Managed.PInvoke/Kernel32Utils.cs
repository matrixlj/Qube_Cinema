using System;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;

namespace Qube.Utils.Managed.PInvoke;

public static class Kernel32Utils
{
	public const uint FILE_FLAG_NO_BUFFERING = 536870912u;

	public const uint FILE_FLAG_WRITE_THROUGH = 2147483648u;

	[DllImport("kernel32", SetLastError = true)]
	public static extern SafeFileHandle CreateFile(string FileName, uint DesiredAccess, uint ShareMode, IntPtr SecurityAttributes, uint CreationDisposition, uint FlagsAndAttributes, IntPtr Template);
}
