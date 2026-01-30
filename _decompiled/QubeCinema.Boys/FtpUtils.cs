using System;
using System.Net;
using Qube.ExtensionMethods;

namespace QubeCinema.Boys;

public class FtpUtils
{
	public static FtpWebResponse GetFtpWebResponse(Uri uri, ICredentials credentials, string ftpWebMethod)
	{
		FtpWebRequest ftpWebRequest = (FtpWebRequest)WebRequest.Create(uri);
		if (credentials != null)
		{
			ftpWebRequest.Credentials = credentials;
		}
		ftpWebRequest.Method = ftpWebMethod;
		return (FtpWebResponse)ftpWebRequest.GetResponse();
	}

	public static long GetFileSize(Uri uri, ICredentials credentials)
	{
		try
		{
			using FtpWebResponse ftpWebResponse = GetFtpWebResponse(uri, credentials, "SIZE");
			if (ftpWebResponse.StatusCode == FtpStatusCode.FileStatus)
			{
				return ftpWebResponse.ContentLength;
			}
		}
		catch
		{
		}
		using FTP fTP = new FTP(uri, credentials);
		return fTP.GetFileSize(uri.AbsolutePath.UrlDecode());
	}
}
