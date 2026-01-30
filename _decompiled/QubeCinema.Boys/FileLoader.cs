using System;
using System.IO;
using System.Net;
using System.Security.Cryptography;
using System.Xml;
using Qube.ExtensionMethods;

namespace QubeCinema.Boys;

public class FileLoader : IDisposable
{
	private MemoryStream _memStream;

	private bool _isDisposed;

	public Uri FileUri { get; private set; }

	public XmlDocument LoadXml(Uri uri, ICredentials credentials)
	{
		_isDisposed = false;
		FileUri = uri;
		if (uri.Scheme == Uri.UriSchemeFtp)
		{
			return _DownloadFtpXmlFile(uri, credentials);
		}
		XmlUrlResolver xmlUrlResolver = new XmlUrlResolver();
		xmlUrlResolver.Credentials = credentials;
		XmlDocument xmlDocument = new XmlDocument();
		xmlDocument.PreserveWhitespace = true;
		xmlDocument.XmlResolver = xmlUrlResolver;
		xmlDocument.Load(uri.GetPath());
		return xmlDocument;
	}

	public void Load(Uri uri, CredentialCache credentialCache)
	{
		_memStream = new MemoryStream();
		_isDisposed = false;
		FileUri = uri;
		if (uri.Scheme == Uri.UriSchemeFtp)
		{
			_DownloadFtpFile(uri, credentialCache);
			return;
		}
		XmlUrlResolver xmlUrlResolver = new XmlUrlResolver();
		xmlUrlResolver.Credentials = credentialCache;
		using Stream src = xmlUrlResolver.GetEntity(uri, null, typeof(Stream)) as Stream;
		_Copy(src, _memStream);
	}

	private XmlDocument _DownloadFtpXmlFile(Uri uri, ICredentials credentials)
	{
		using WebResponse webResponse = FtpUtils.GetFtpWebResponse(uri, credentials, "RETR");
		using (webResponse.GetResponseStream())
		{
			XmlDocument xmlDocument = new XmlDocument();
			xmlDocument.PreserveWhitespace = true;
			xmlDocument.Load(webResponse.GetResponseStream());
			return xmlDocument;
		}
	}

	private void _DownloadFtpFile(Uri uri, ICredentials credentials)
	{
		using WebResponse webResponse = FtpUtils.GetFtpWebResponse(uri, credentials, "RETR");
		using Stream src = webResponse.GetResponseStream();
		_Copy(src, _memStream);
	}

	public bool CheckHash(byte[] expectedHash, out string calculatedHash)
	{
		SHA1Managed sHA1Managed = new SHA1Managed();
		byte[] inArray = sHA1Managed.ComputeHash(GetStream());
		calculatedHash = Convert.ToBase64String(inArray);
		return calculatedHash == Convert.ToBase64String(expectedHash);
	}

	public Stream GetStream()
	{
		_memStream.Position = 0L;
		return _memStream;
	}

	private static void _Copy(Stream src, Stream dest)
	{
		int num = -1;
		while ((num = src.ReadByte()) != -1)
		{
			dest.WriteByte(Convert.ToByte(num));
		}
	}

	public void Dispose()
	{
		_Dispose(disposing: true);
		GC.SuppressFinalize(this);
	}

	private void _Dispose(bool disposing)
	{
		if (!_isDisposed)
		{
			if (_memStream != null)
			{
				_memStream.Close();
			}
			_memStream = null;
		}
		_isDisposed = true;
	}
}
