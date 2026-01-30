using System.Collections;
using System.IO;
using System.Text;
using ICSharpCode.SharpZipLib.Tar;
using ICSharpCode.SharpZipLib.Zip;
using ICSharpCode.SharpZipLib.Zip.Compression.Streams;

namespace Qube;

public class FileCompressor
{
	public void CompressToZipFile(string sourcePath, string destPath)
	{
		//IL_000e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0014: Expected O, but got Unknown
		//IL_0044: Unknown result type (might be due to invalid IL or missing references)
		//IL_004b: Expected O, but got Unknown
		ArrayList arrayList = _GenerateFileList(sourcePath);
		ZipOutputStream val = new ZipOutputStream((Stream)File.Create(destPath));
		val.SetLevel(9);
		foreach (string item in arrayList)
		{
			ZipEntry val2 = new ZipEntry(item.Remove(0, sourcePath.Length + 1));
			val.PutNextEntry(val2);
			if (!item.EndsWith("/"))
			{
				FileStream fileStream = File.OpenRead(item);
				byte[] array = new byte[fileStream.Length];
				fileStream.Read(array, 0, array.Length);
				fileStream.Close();
				((Stream)(object)val).Write(array, 0, array.Length);
			}
		}
		((DeflaterOutputStream)val).Finish();
		((Stream)(object)val).Close();
	}

	public void CompressToTarFile(string sourcPath, string destPath)
	{
		string currentDirectory = Directory.GetCurrentDirectory();
		Directory.SetCurrentDirectory(sourcPath);
		DirectoryInfo directoryInfo = new DirectoryInfo(sourcPath);
		Stream stream = new FileStream(destPath, FileMode.OpenOrCreate);
		TarArchive val = TarArchive.CreateOutputTarArchive(stream);
		TarEntry val2 = TarEntry.CreateEntryFromFile(directoryInfo.Name);
		val2.TarHeader.magic = new StringBuilder(TarHeader.TMAGIC);
		val.WriteEntry(val2, true);
		val.CloseArchive();
		stream.Close();
		Directory.SetCurrentDirectory(currentDirectory);
	}

	private ArrayList _GenerateFileList(string dir)
	{
		ArrayList arrayList = new ArrayList();
		bool flag = true;
		string[] files = Directory.GetFiles(dir);
		foreach (string value in files)
		{
			arrayList.Add(value);
			flag = false;
		}
		if (flag && Directory.GetDirectories(dir).Length == 0)
		{
			arrayList.Add(dir + "/");
		}
		string[] directories = Directory.GetDirectories(dir);
		foreach (string dir2 in directories)
		{
			foreach (object item in _GenerateFileList(dir2))
			{
				arrayList.Add(item);
			}
		}
		return arrayList;
	}
}
