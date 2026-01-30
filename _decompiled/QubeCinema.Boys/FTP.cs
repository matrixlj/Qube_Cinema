using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using Qube.ExtensionMethods;

namespace QubeCinema.Boys;

internal class FTP : IDisposable
{
	private string _server;

	private string _username;

	private string _password;

	private int _port;

	private int _timeout;

	private string _messages;

	private string _responseStr;

	private Socket _socket;

	private int _response;

	private string _bucket;

	public FTP()
	{
		_Init();
		_SetCredentials("anonymous", "anonymous@");
	}

	public FTP(string server, string username, string password)
		: this()
	{
		_server = server;
		_SetCredentials(username, password);
	}

	public FTP(string server, int port, string username, string password)
		: this()
	{
		_server = server;
		_SetCredentials(username, password);
		_port = port;
	}

	public FTP(Uri uri, ICredentials credentials)
		: this()
	{
		if (credentials != null)
		{
			NetworkCredential credential = credentials.GetCredential(uri, AuthenticationSchemes.Basic.ToString());
			if (credential != null)
			{
				_username = credential.UserName;
				_password = credential.Password;
			}
		}
		_server = uri.Host;
		_port = uri.Port;
	}

	private void _Init()
	{
		_server = null;
		_port = 21;
		_socket = null;
		_bucket = "";
		_timeout = 10000;
		_messages = "";
	}

	private void _SetCredentials(string username, string password)
	{
		if (!username.IsNullOrWhiteSpace())
		{
			_username = username;
			_password = password;
		}
	}

	private void _Fail()
	{
		Disconnect();
		throw new Exception(_responseStr);
	}

	private void _SetBinaryMode(bool mode)
	{
		if (mode)
		{
			_SendCommand("TYPE I");
		}
		else
		{
			_SendCommand("TYPE A");
		}
		_ReadResponse();
		if (_response != 200)
		{
			_Fail();
		}
	}

	private void _SendCommand(string command)
	{
		byte[] bytes = Encoding.UTF8.GetBytes((command + "\r\n").ToCharArray());
		_socket.Send(bytes, bytes.Length, SocketFlags.None);
	}

	private void _FillBucket()
	{
		byte[] array = new byte[512];
		int num = 0;
		while (_socket.Available < 1)
		{
			Thread.Sleep(50);
			num += 50;
			if (num > _timeout)
			{
				Disconnect();
				throw new Exception("Timed out waiting on server to respond.");
			}
		}
		while (_socket.Available > 0)
		{
			long num2 = _socket.Receive(array, 512, SocketFlags.None);
			_bucket += Encoding.UTF8.GetString(array, 0, (int)num2);
			Thread.Sleep(50);
		}
	}

	private string _GetLineFromBucket()
	{
		string text = "";
		int num;
		if ((num = _bucket.IndexOf('\n')) < 0)
		{
			while (num < 0)
			{
				_FillBucket();
				num = _bucket.IndexOf('\n');
			}
		}
		text = _bucket.Substring(0, num);
		_bucket = _bucket.Substring(num + 1);
		return text;
	}

	private void _ReadResponse()
	{
		_messages = "";
		string text;
		while (true)
		{
			text = _GetLineFromBucket();
			if (Regex.Match(text, "^[0-9]+ ").Success)
			{
				break;
			}
			_messages = _messages + Regex.Replace(text, "^[0-9]+-", "") + "\n";
		}
		_responseStr = text;
		_response = int.Parse(text.Substring(0, 3));
	}

	public void Disconnect()
	{
		if (_socket != null)
		{
			if (_socket.Connected)
			{
				_SendCommand("QUIT");
				_socket.Close();
			}
			_socket = null;
		}
	}

	public void Connect()
	{
		if (_server == null)
		{
			throw new Exception("No server has been set.");
		}
		if (_socket != null && _socket.Connected)
		{
			return;
		}
		_socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
		_socket.Connect(_server, _port);
		_ReadResponse();
		if (_response != 220)
		{
			_Fail();
		}
		_SendCommand("USER " + _username);
		_ReadResponse();
		int response = _response;
		if (response != 230 && response == 331)
		{
			_SendCommand("PASS " + _password);
			_ReadResponse();
			if (_response != 230)
			{
				_Fail();
			}
		}
	}

	public long GetFileSize(string filename)
	{
		Connect();
		_SetBinaryMode(mode: true);
		_SendCommand("SIZE " + filename);
		_ReadResponse();
		if (_response != 213)
		{
			throw new Exception(_responseStr);
		}
		return long.Parse(_responseStr.Substring(4));
	}

	void IDisposable.Dispose()
	{
		Disconnect();
		GC.SuppressFinalize(this);
	}
}
