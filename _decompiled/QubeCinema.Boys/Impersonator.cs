using System;
using System.Net;
using System.Runtime.InteropServices;
using System.Security.Principal;

namespace QubeCinema.Boys;

public class Impersonator
{
	private const int LOGON32_LOGON_NEW_CREDENTIALS = 9;

	private const int LOGON32_LOGON_NETWORK_CLEARTEXT = 8;

	private const int LOGON32_PROVIDER_DEFAULT = 0;

	private const int SecurityImpersonation = 2;

	[DllImport("advapi32.dll")]
	private static extern int LogonUserA(string userName, string domain, string password, int logonType, int logonProvider, ref IntPtr token);

	public static WindowsImpersonationContext Impersonate(Uri uri, ICredentials credentials)
	{
		if (credentials == null)
		{
			throw new Exception($"Supplied credentials could not be used to access: {uri}");
		}
		IntPtr token = IntPtr.Zero;
		NetworkCredential credential = credentials.GetCredential(uri, "Negotiate");
		if (credential == null)
		{
			throw new Exception($"Supplied credentials could not be used to access: {uri}");
		}
		string userName = credential.UserName;
		string domain = credential.Domain;
		if (credential.Domain == null || credential.Domain == "")
		{
			string[] array = credential.UserName.Split('\\');
			domain = ((array.Length > 1) ? array[0] : uri.Host);
			if (array.Length > 1)
			{
				userName = array[array.Length - 1];
			}
		}
		if (LogonUserA(userName, domain, credential.Password, 8, 0, ref token) != 0)
		{
			return WindowsIdentity.Impersonate(token);
		}
		if (LogonUserA(userName, domain, credential.Password, 9, 0, ref token) != 0)
		{
			return WindowsIdentity.Impersonate(token);
		}
		throw new Exception("Logon failed!");
	}
}
