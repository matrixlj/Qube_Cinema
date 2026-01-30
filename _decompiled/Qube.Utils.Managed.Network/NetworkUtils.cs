using System;
using System.Collections.Specialized;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;

namespace Qube.Utils.Managed.Network;

public class NetworkUtils
{
	private static readonly string _smsIpAddress;

	static NetworkUtils()
	{
		_smsIpAddress = string.Empty;
		_smsIpAddress = _GetSmsIpAddress();
	}

	private static string _GetSmsIpAddress()
	{
		NameValueCollection nameValueCollection = ConfigurationManager.GetSection("SharedConfig") as NameValueCollection;
		string[] source = new string[0];
		if (nameValueCollection["IpAddressesToIgnore"] != null)
		{
			source = nameValueCollection["IpAddressesToIgnore"].Split(new char[2] { ',', ' ' }, StringSplitOptions.RemoveEmptyEntries);
		}
		NetworkInterface[] allNetworkInterfaces = NetworkInterface.GetAllNetworkInterfaces();
		NetworkInterface[] array = allNetworkInterfaces;
		foreach (NetworkInterface networkInterface in array)
		{
			IPInterfaceProperties iPProperties = networkInterface.GetIPProperties();
			UnicastIPAddressInformationCollection unicastAddresses = iPProperties.UnicastAddresses;
			foreach (UnicastIPAddressInformation item in unicastAddresses)
			{
				IPAddress address = item.Address;
				if (address != null && address.AddressFamily == AddressFamily.InterNetwork && !source.Contains(address.ToString()) && !IPAddress.IsLoopback(address) && item.IsDnsEligible)
				{
					return address.ToString();
				}
			}
		}
		return "127.0.0.1";
	}

	public static string GetSmsIpAddress()
	{
		return _smsIpAddress;
	}

	public static string GetMachineHostName()
	{
		return Dns.GetHostName();
	}
}
