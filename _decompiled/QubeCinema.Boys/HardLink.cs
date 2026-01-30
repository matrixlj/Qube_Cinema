using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;
using System.Text;
using Microsoft.Win32.SafeHandles;

namespace QubeCinema.Boys;

public class HardLink
{
	private struct BY_HANDLE_FILE_INFORMATION
	{
		public uint FileAttributes;

		public System.Runtime.InteropServices.ComTypes.FILETIME CreationTime;

		public System.Runtime.InteropServices.ComTypes.FILETIME LastAccessTime;

		public System.Runtime.InteropServices.ComTypes.FILETIME LastWriteTime;

		public int VolumeSerialNumber;

		public int FileSizeHigh;

		public int FileSizeLow;

		public int NumberOfLinks;

		public int FileIndexHigh;

		public int FileIndexLow;
	}

	[Flags]
	public enum EFileAccess : uint
	{
		GenericRead = 0x80000000u,
		GenericWrite = 0x40000000u,
		GenericExecute = 0x20000000u,
		GenericAll = 0x10000000u
	}

	[Flags]
	public enum EFileShare : uint
	{
		None = 0u,
		Read = 1u,
		Write = 2u,
		Delete = 4u
	}

	public enum ECreationDisposition : uint
	{
		New = 1u,
		CreateAlways,
		OpenExisting,
		OpenAlways,
		TruncateExisting
	}

	[Flags]
	public enum EFileAttributes : uint
	{
		Readonly = 1u,
		Hidden = 2u,
		System = 4u,
		Directory = 0x10u,
		Archive = 0x20u,
		Device = 0x40u,
		Normal = 0x80u,
		Temporary = 0x100u,
		SparseFile = 0x200u,
		ReparsePoint = 0x400u,
		Compressed = 0x800u,
		Offline = 0x1000u,
		NotContentIndexed = 0x2000u,
		Encrypted = 0x4000u,
		Write_Through = 0x80000000u,
		Overlapped = 0x40000000u,
		NoBuffering = 0x20000000u,
		RandomAccess = 0x10000000u,
		SequentialScan = 0x8000000u,
		DeleteOnClose = 0x4000000u,
		BackupSemantics = 0x2000000u,
		PosixSemantics = 0x1000000u,
		OpenReparsePoint = 0x200000u,
		OpenNoRecall = 0x100000u,
		FirstPipeInstance = 0x80000u
	}

	private const int ERROR_MORE_DATA = 234;

	private const int HFILE_ERROR = -1;

	[DllImport("kernel32.dll", SetLastError = true)]
	private static extern bool CreateHardLink(string LpFileName, string LpExistingFileName, IntPtr lpSecurityAttributes);

	[DllImport("kernel32.dll", SetLastError = true)]
	private static extern bool DeleteFile(string LpFileName);

	[DllImport("kernel32.dll")]
	private static extern int GetLastError();

	[DllImport("kernel32.dll", SetLastError = true)]
	private static extern bool GetFileInformationByHandle(IntPtr hFile, ref BY_HANDLE_FILE_INFORMATION lpFileInformation);

	[DllImport("kernel32.dll", SetLastError = true)]
	private static extern IntPtr FindFirstFileName(ref string lpFileName, int dwFlags, ref int StringLength, ref StringBuilder LinkName);

	[DllImport("kernel32.dll", SetLastError = true)]
	private static extern IntPtr CreateFile(string lpFileName, EFileAccess dwDesiredAccess, EFileShare dwShareMode, IntPtr lpSecurityAttributes, ECreationDisposition dwCreationDisposition, EFileAttributes dwFlagsAndAttributes, IntPtr hTemplateFile);

	public static void Create(string targetPath, string hardLinkPath)
	{
		if (CreateHardLink(hardLinkPath, targetPath, IntPtr.Zero))
		{
			return;
		}
		throw new HardLinkException($"Hard link creation failed. \nTarget path : {targetPath},  Hard Link path : {hardLinkPath}. \nError : {GetLastError()}");
	}

	public static void Delete(string path)
	{
		if (DeleteFile(path))
		{
			return;
		}
		throw new HardLinkException($"Error while deleting hardLink. \nPath : {path} \nError : {GetLastError()}");
	}

	public static int Count(string fileName)
	{
		BY_HANDLE_FILE_INFORMATION fileInfo = default(BY_HANDLE_FILE_INFORMATION);
		_CreateFileInfohandle(fileName, ref fileInfo);
		return fileInfo.NumberOfLinks;
	}

	public static bool IsHardLink(string file1, string file2)
	{
		BY_HANDLE_FILE_INFORMATION fileInfo = default(BY_HANDLE_FILE_INFORMATION);
		BY_HANDLE_FILE_INFORMATION fileInfo2 = default(BY_HANDLE_FILE_INFORMATION);
		if (!File.Exists(file1) || !File.Exists(file2))
		{
			return false;
		}
		_CreateFileInfohandle(file1, ref fileInfo);
		_CreateFileInfohandle(file2, ref fileInfo2);
		if (fileInfo.VolumeSerialNumber != fileInfo2.VolumeSerialNumber)
		{
			return false;
		}
		if (fileInfo.FileIndexLow != fileInfo2.FileIndexLow)
		{
			return false;
		}
		if (fileInfo.FileIndexHigh != fileInfo2.FileIndexHigh)
		{
			return false;
		}
		return true;
	}

	private static void _CreateFileInfohandle(string fileName, ref BY_HANDLE_FILE_INFORMATION fileInfo)
	{
		SafeFileHandle safeFileHandle = new SafeFileHandle(CreateFile(fileName, EFileAccess.GenericRead, EFileShare.Read | EFileShare.Write | EFileShare.Delete, IntPtr.Zero, ECreationDisposition.OpenExisting, EFileAttributes.Normal, IntPtr.Zero), ownsHandle: true);
		try
		{
			if (safeFileHandle.IsInvalid)
			{
				throw new HardLinkException($"ERROR : Invalid SafeFileHandle. \nFile {fileName}");
			}
			if (GetFileInformationByHandle(safeFileHandle.DangerousGetHandle(), ref fileInfo))
			{
				return;
			}
			throw new HardLinkException($"Unable to retrieve File Information for the file {fileName}. \nError : {GetLastError()}");
		}
		finally
		{
			safeFileHandle.Close();
		}
	}
}
