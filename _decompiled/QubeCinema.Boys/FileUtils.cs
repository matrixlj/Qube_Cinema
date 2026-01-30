using System;
using System.IO;
using System.Net;

namespace QubeCinema.Boys;

public class FileUtils
{
	public static bool CanDelete(string filePath)
	{
		try
		{
			using (File.OpenWrite(filePath))
			{
				return true;
			}
		}
		catch
		{
			return false;
		}
	}

	public static void Delete(string filePath)
	{
		FileAttributes attributes = File.GetAttributes(filePath);
		if ((attributes & FileAttributes.ReadOnly) == FileAttributes.ReadOnly)
		{
			File.SetAttributes(filePath, attributes & ~FileAttributes.ReadOnly);
		}
		File.Delete(filePath);
	}

	public bool IsFileExists(Uri uri, ICredentials credentials)
	{
		if (uri == null)
		{
			return false;
		}
		if (uri.Scheme == Uri.UriSchemeFile)
		{
			return _IsUncFileExists(uri, credentials);
		}
		if (uri.Scheme == Uri.UriSchemeFtp)
		{
			return _IsFTPFileExists(uri, credentials);
		}
		if (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
		{
			return _IsHttpFileExists(uri, credentials);
		}
		return false;
	}

	private bool _IsFTPFileExists(Uri uri, ICredentials credential)
	{
		try
		{
			FtpWebRequest ftpWebRequest = (FtpWebRequest)WebRequest.Create(uri);
			if (credential != null)
			{
				ftpWebRequest.Credentials = credential;
			}
			using ((FtpWebResponse)ftpWebRequest.GetResponse())
			{
				return true;
			}
		}
		catch (WebException ex)
		{
			FtpWebResponse ftpWebResponse = (FtpWebResponse)ex.Response;
			if (ftpWebResponse.StatusCode == FtpStatusCode.ActionNotTakenFileUnavailable)
			{
				return false;
			}
			if (ftpWebResponse.StatusCode == FtpStatusCode.NotLoggedIn)
			{
				throw new UnauthorizedAccessException($"Path: {uri.ToString()} \n Error: {ex.Message}");
			}
			throw;
		}
	}

	private bool _IsHttpFileExists(Uri uri, ICredentials credential)
	{
		try
		{
			HttpWebRequest httpWebRequest = (HttpWebRequest)WebRequest.Create(uri);
			if (credential != null)
			{
				httpWebRequest.Credentials = credential;
			}
			using HttpWebResponse httpWebResponse = (HttpWebResponse)httpWebRequest.GetResponse();
			return httpWebResponse.StatusCode == HttpStatusCode.OK;
		}
		catch (WebException ex)
		{
			HttpWebResponse httpWebResponse2 = (HttpWebResponse)ex.Response;
			if (httpWebResponse2.StatusCode == HttpStatusCode.NotFound)
			{
				return false;
			}
			if (httpWebResponse2.StatusCode == HttpStatusCode.Unauthorized)
			{
				throw new UnauthorizedAccessException($"Path: {uri.ToString()} \n Error: {ex.Message}");
			}
			throw;
		}
	}

	private bool _IsUncFileExists(Uri uri, ICredentials credential)
	{
		return File.Exists(uri.LocalPath);
	}
}
