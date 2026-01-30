using System;

namespace Qube.ExtensionMethods;

public static class UriExtensions
{
	public static string GetPath(this Uri uri)
	{
		if (uri.Scheme == Uri.UriSchemeFile)
		{
			return uri.LocalPath;
		}
		return uri.AbsoluteUri.UrlDecode();
	}

	public static string GetRelativePath(this Uri baseUri, Uri absoluteUri)
	{
		return absoluteUri.GetPath().Replace(baseUri.GetPath(), "");
	}

	public static Uri ReplaceHost(this Uri uri, string host)
	{
		UriBuilder uriBuilder = new UriBuilder(uri.Scheme, host, uri.Port, uri.PathAndQuery);
		return uriBuilder.Uri;
	}
}
