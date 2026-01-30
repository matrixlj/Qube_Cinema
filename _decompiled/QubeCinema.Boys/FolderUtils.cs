using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using Qube.ExtensionMethods;

namespace QubeCinema.Boys;

public class FolderUtils
{
	private enum ResourceType
	{
		File,
		Folder
	}

	public List<string> GetSubFolders(Uri uri, ICredentials credentials)
	{
		if (uri == null)
		{
			return new List<string>();
		}
		List<string> source = new List<string>();
		switch (uri.Scheme)
		{
		case "file":
			source = _GetUNCSubFolders(uri, credentials);
			break;
		case "ftp":
			source = _GetFTPSubFolders(uri, credentials);
			break;
		case "http":
		case "https":
			source = _GetHTTPSubFolders(uri, credentials);
			break;
		}
		return source.Select((string path) => Common.Path.SuffixSlashIfNotExists(new Uri(uri, path).GetPath())).ToList();
	}

	public static bool CheckPermission(string path, ICredentials credential)
	{
		path = Common.Path.SuffixSlashIfNotExists(path);
		Uri uri = new Uri(path);
		try
		{
			if (uri.Scheme == Uri.UriSchemeFile)
			{
				_CheckFileSchemePermission(uri, credential);
			}
			else if (uri.Scheme == Uri.UriSchemeFtp)
			{
				_CheckFtpSchemePermission(uri, credential);
			}
			else if (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
			{
				_CheckHttpSchemePermission(uri, credential);
			}
			return true;
		}
		catch (UnauthorizedAccessException)
		{
			return false;
		}
	}

	public List<string> GetFiles(Uri uri, ICredentials credential)
	{
		if (uri.Scheme == Uri.UriSchemeFtp)
		{
			return _GetFtpDirectoryFiles(uri, credential);
		}
		if (uri.Scheme == Uri.UriSchemeFile)
		{
			return _GetUNCDirectoryFiles(uri, credential);
		}
		if (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
		{
			return _GetHttpDirectoryFiles(uri, credential);
		}
		return new List<string>();
	}

	private static void _CheckFileSchemePermission(Uri uri, ICredentials credential)
	{
		DirectoryInfo directoryInfo = new DirectoryInfo(uri.GetPath());
		if (credential == null)
		{
			_ = directoryInfo.Attributes;
			return;
		}
		using (Impersonator.Impersonate(uri, credential))
		{
			_ = directoryInfo.Attributes;
		}
	}

	private static void _CheckFtpSchemePermission(Uri uri, ICredentials credential)
	{
		try
		{
			using (FtpUtils.GetFtpWebResponse(uri, credential, "LIST"))
			{
			}
		}
		catch (WebException ex)
		{
			FtpWebResponse ftpWebResponse = (FtpWebResponse)ex.Response;
			if (ftpWebResponse.StatusCode == FtpStatusCode.NotLoggedIn)
			{
				throw new UnauthorizedAccessException(ex.Message);
			}
			throw;
		}
	}

	private static void _CheckHttpSchemePermission(Uri uri, ICredentials credential)
	{
		try
		{
			HttpWebRequest httpWebRequest = (HttpWebRequest)WebRequest.Create(uri);
			if (credential != null)
			{
				httpWebRequest.Credentials = credential;
			}
			using (httpWebRequest.GetResponse())
			{
			}
		}
		catch (WebException ex)
		{
			HttpWebResponse httpWebResponse = (HttpWebResponse)ex.Response;
			if (httpWebResponse.StatusCode == HttpStatusCode.Unauthorized)
			{
				throw new UnauthorizedAccessException(ex.Message);
			}
			throw;
		}
	}

	private List<string> _GetUNCSubFolders(Uri uri, ICredentials credential)
	{
		return _GetUNCSubFolders(uri);
	}

	private List<string> _GetUNCSubFolders(Uri uri)
	{
		if (Directory.Exists(uri.LocalPath))
		{
			return new List<string>(Directory.GetDirectories(uri.LocalPath));
		}
		return new List<string>();
	}

	private List<string> _GetFTPSubFolders(Uri uri, ICredentials credential)
	{
		List<string> list = null;
		try
		{
			using WebResponse webResponse = FtpUtils.GetFtpWebResponse(uri, credential, "LIST");
			using StreamReader reader = new StreamReader(webResponse.GetResponseStream(), Encoding.UTF8);
			list = _GetFTPSubDirectoryList(reader);
		}
		catch (WebException ex)
		{
			FtpWebResponse ftpWebResponse = (FtpWebResponse)ex.Response;
			if (ftpWebResponse.StatusCode == FtpStatusCode.NotLoggedIn)
			{
				throw new UnauthorizedAccessException(ex.Message);
			}
		}
		catch (Exception)
		{
		}
		finally
		{
			if (list == null)
			{
				list = new List<string>();
			}
		}
		return list;
	}

	private List<string> _GetFTPSubDirectoryList(StreamReader reader)
	{
		List<string> list = new List<string>();
		if (reader == null)
		{
			return list;
		}
		FTPLineParser fTPLineParser = new FTPLineParser();
		string text = null;
		StringBuilder stringBuilder = new StringBuilder();
		while ((text = reader.ReadLine()) != null)
		{
			try
			{
				FTPLineResult fTPLineResult = fTPLineParser.Parse(text);
				if (fTPLineResult.IsDirectory && fTPLineResult.Name != "." && fTPLineResult.Name != "..")
				{
					list.Add(fTPLineResult.Name);
				}
			}
			catch
			{
				stringBuilder.AppendFormat("\n{0}", text);
			}
		}
		if (stringBuilder.Length > 0)
		{
			Logger.Log("Usher", $"Error while enumerating FTP sub folders. \nUnable to parse the following ftp lines : \n{stringBuilder.ToString()}", EventLogEntryType.Warning);
		}
		return list;
	}

	private List<string> _GetHTTPSubFolders(Uri uri, ICredentials credential)
	{
		return _GetHttpResources(uri, credential, ResourceType.Folder);
	}

	private List<string> _GetFtpDirectoryFiles(Uri uri, ICredentials credential)
	{
		try
		{
			List<string> list = new List<string>();
			using (WebResponse webResponse = FtpUtils.GetFtpWebResponse(uri, credential, "NLST"))
			{
				using StreamReader streamReader = new StreamReader(webResponse.GetResponseStream(), Encoding.UTF8);
				string relativeUri;
				while ((relativeUri = streamReader.ReadLine()) != null)
				{
					list.Add(new Uri(uri, relativeUri).GetPath());
				}
			}
			return list;
		}
		catch (WebException ex)
		{
			FtpWebResponse ftpWebResponse = (FtpWebResponse)ex.Response;
			if (ftpWebResponse.StatusCode == FtpStatusCode.NotLoggedIn)
			{
				throw new UnauthorizedAccessException(ex.Message);
			}
			throw;
		}
	}

	private List<string> _GetUNCDirectoryFiles(Uri uri, ICredentials credentials)
	{
		return Directory.GetFiles(uri.GetPath()).ToList();
	}

	private List<string> _GetHttpDirectoryFiles(Uri uri, ICredentials credential)
	{
		return _GetHttpResources(uri, credential, ResourceType.File);
	}

	private List<string> _GetHttpResources(Uri uri, ICredentials credential, ResourceType resourceType)
	{
		List<string> list = new List<string>();
		HttpWebRequest httpWebRequest = (HttpWebRequest)WebRequest.Create(uri);
		httpWebRequest.Method = "GET";
		if (credential != null)
		{
			httpWebRequest.Credentials = credential;
		}
		using WebResponse webResponse = httpWebRequest.GetResponse();
		using StreamReader streamReader = new StreamReader(webResponse.GetResponseStream(), Encoding.UTF8);
		string pattern = "(?<pre>[<]pre[>])?\\<a\\s[^\\<\\>]*?href=(?<quote>['\"])(?<href>((?!\\k<quote>).)*)\\k<quote>[^\\>]*\\>(?<linkHtml>((?!\\</a\\s*\\>).)*)\\</a\\s*\\>";
		Regex regex = new Regex(pattern, RegexOptions.IgnoreCase | RegexOptions.ExplicitCapture);
		string absolutePath = uri.AbsolutePath;
		string input;
		while ((input = streamReader.ReadLine()) != null)
		{
			Match match = regex.Match(input);
			while (match.Success)
			{
				string value = match.Groups["href"].Value;
				if (!(value == ".") && !(value == "..") && (resourceType != ResourceType.Folder || value.EndsWith("/")) && (resourceType != ResourceType.File || !value.EndsWith("/")))
				{
					string value2 = match.Groups["linkHtml"].Value.UrlDecode();
					Uri uri2 = new Uri(uri, value);
					if (uri2.AbsolutePath.Contains(absolutePath) && uri2.Segments[uri2.Segments.Length - 1].UrlDecode().StartsWith(value2))
					{
						list.Add(uri2.GetPath());
					}
				}
				match = match.NextMatch();
			}
		}
		return list;
	}
}
