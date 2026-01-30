using System;
using System.Collections.Generic;
using System.Configuration;
using System.Net;
using System.Net.Sockets;

namespace QubeCinema.Boys;

public class Telnet : IDisposable
{
	public const int DefaultPort = 23;

	private Socket _socket;

	private IPEndPoint _endPoint;

	private object _lock = new object();

	public Telnet(IPAddress addr)
		: this(new IPEndPoint(addr, 23))
	{
	}

	public Telnet(string hostNameOrAddress)
		: this(hostNameOrAddress, 23)
	{
	}

	public Telnet(string hostNameOrAddress, int port)
	{
		IPAddress[] hostAddresses = Dns.GetHostAddresses(hostNameOrAddress);
		_endPoint = new IPEndPoint(hostAddresses[0], port);
		_CreateSocket();
	}

	public Telnet(IPEndPoint endPoint)
	{
		_endPoint = endPoint;
		_CreateSocket();
	}

	private void _CreateSocket()
	{
		_socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
		if (!int.TryParse(ConfigurationManager.AppSettings["AutomationCommandTimeout"], out var result))
		{
			result = 5000;
		}
		_socket.SendTimeout = result;
		_socket.ReceiveTimeout = result;
	}

	public void Connect()
	{
		if (_socket == null)
		{
			_CreateSocket();
		}
		if (!_socket.Connected)
		{
			_socket.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.KeepAlive, optionValue: true);
			_socket.Connect(_endPoint);
		}
	}

	public void Disconnect()
	{
		if (_socket != null)
		{
			if (_socket.Connected)
			{
				_socket.Shutdown(SocketShutdown.Both);
			}
			_socket.Close();
			_socket = null;
		}
	}

	public void Send(byte[] bytes)
	{
		lock (_lock)
		{
			_FlushInputBuffer(_socket);
			_socket.Send(bytes);
		}
	}

	public byte[] Receive()
	{
		lock (_lock)
		{
			byte[] array = new byte[_socket.Available];
			_socket.Receive(array);
			return array;
		}
	}

	public byte[] SendAndReceive(byte[] bytes, byte[] inputTerm)
	{
		byte[] array = null;
		lock (_lock)
		{
			_FlushInputBuffer(_socket);
			_socket.Send(bytes);
			return _ReadUntil(_socket, inputTerm);
		}
	}

	private void _FlushInputBuffer(Socket socket)
	{
		int available = socket.Available;
		if (available > 0)
		{
			byte[] buffer = new byte[available];
			if (socket.Receive(buffer) != available)
			{
				_FlushInputBuffer(socket);
			}
		}
	}

	private byte[] _ReadUntil(Socket socket, byte[] responseFooter)
	{
		List<byte> list = new List<byte>();
		byte[] array = new byte[1];
		do
		{
			socket.Receive(array);
			list.Add(array[0]);
		}
		while (!_IsEndOfResponse(list, responseFooter));
		return list.ToArray();
	}

	private bool _IsEndOfResponse(List<byte> responseBuffer, byte[] responseFooter)
	{
		int num = responseFooter.Length;
		int count = responseBuffer.Count;
		if (count < num)
		{
			return false;
		}
		int num2 = count - num;
		int num3 = 0;
		while (num3 < responseFooter.Length)
		{
			if (responseBuffer[num2] != responseFooter[num3])
			{
				return false;
			}
			num3++;
			num2++;
		}
		return true;
	}

	public void Dispose()
	{
		_Dispose();
		GC.SuppressFinalize(this);
	}

	private void _Dispose()
	{
		Disconnect();
	}
}
