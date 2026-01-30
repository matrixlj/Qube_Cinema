using System;
using System.Net;
using System.Net.Sockets;

namespace Qube;

public class SntpClient : IDisposable
{
	private const int NtpPort = 123;

	private const int NtpMessageSize = 48;

	private const int SocketReceiveTimeout = 5000;

	private const int MaxTimeoutRetries = 5;

	private static readonly DateTime NtpEpoch = new DateTime(1900, 1, 1, 0, 0, 0, DateTimeKind.Utc);

	private object _lockObject = new object();

	private UdpClient _udpClient = new UdpClient();

	public SntpClient(string server)
	{
		_udpClient.Connect(server, 123);
		_udpClient.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReceiveTimeout, 5000);
	}

	private DateTime _GetTimestamp(byte[] bytes, int startIndex)
	{
		uint num = 0u;
		num |= (uint)(bytes[startIndex] << 24);
		num |= (uint)(bytes[startIndex + 1] << 16);
		num |= (uint)(bytes[startIndex + 2] << 8);
		num |= bytes[startIndex + 3];
		return NtpEpoch.AddSeconds(num);
	}

	public DateTime GetTimeOfDay()
	{
		lock (_lockObject)
		{
			int num = 0;
			while (true)
			{
				try
				{
					return _GetTimeOfDay();
				}
				catch (SocketException ex)
				{
					if (++num >= 5)
					{
						throw ex;
					}
				}
			}
		}
	}

	public DateTime _GetTimeOfDay()
	{
		byte[] array = new byte[48];
		array[0] = 11;
		array[1] = 0;
		array[2] = 6;
		array[3] = 250;
		DateTime now = DateTime.Now;
		_udpClient.Send(array, array.Length);
		IPEndPoint remoteEP = null;
		array = _udpClient.Receive(ref remoteEP);
		DateTime now2 = DateTime.Now;
		if ((array[0] & 0xC0) == 192)
		{
			throw new ApplicationException("clock not synchronized");
		}
		if (array[1] == 0)
		{
			throw new ApplicationException("unspecified stratum");
		}
		DateTime dateTime = _GetTimestamp(array, 32);
		DateTime dateTime2 = _GetTimestamp(array, 40);
		return dateTime2.AddSeconds((now2 - now - (dateTime2 - dateTime)).TotalSeconds / 2.0);
	}

	public void Dispose()
	{
		_udpClient.Close();
	}
}
