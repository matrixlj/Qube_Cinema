using System;
using System.IO.Ports;

namespace QubeCinema.Boys;

public class SerialPortSettings
{
	public int BaudRate;

	public int DataBits;

	public Parity Parity;

	public string PortName;

	public StopBits StopBits;

	public SerialPortSettings()
	{
		Parity = Parity.None;
		DataBits = 8;
		StopBits = StopBits.One;
	}

	public SerialPortSettings(string settings)
	{
		Parity = Parity.None;
		DataBits = 8;
		StopBits = StopBits.One;
		ParseSettings(settings);
	}

	public void ParseSettings(string settings)
	{
		string[] array = settings.Split(',');
		if (array.Length < 2)
		{
			throw new Exception("Invalid Serial Port Settings.");
		}
		int num = ((array.Length > 5) ? 5 : array.Length);
		for (int i = 0; i < num; i++)
		{
			string text = array[i].Trim();
			if (text == string.Empty && i < 2)
			{
				throw new Exception("Invalid serial port settings.");
			}
			if (!(text == string.Empty) || i <= 1)
			{
				switch (i)
				{
				case 0:
					PortName = text;
					break;
				case 1:
					BaudRate = Convert.ToInt32(text);
					break;
				case 2:
					Parity = _GetParity(text);
					break;
				case 3:
					DataBits = Convert.ToInt32(text);
					break;
				case 4:
					StopBits = _GetStopBits(text);
					break;
				}
			}
		}
	}

	public SerialPort CreateInstance()
	{
		return new SerialPort(PortName, BaudRate, Parity, DataBits, StopBits);
	}

	public static SerialPortSettings Parse(string settings)
	{
		return new SerialPortSettings(settings);
	}

	public static SerialPort CreateInstance(string settings)
	{
		return new SerialPortSettings(settings).CreateInstance();
	}

	private Parity _GetParity(string parity)
	{
		return parity.ToLower() switch
		{
			"n" => Parity.None, 
			"o" => Parity.Odd, 
			"e" => Parity.Even, 
			"m" => Parity.Mark, 
			"s" => Parity.Space, 
			_ => Parity.None, 
		};
	}

	private StopBits _GetStopBits(string stopBits)
	{
		return stopBits switch
		{
			"1" => StopBits.One, 
			"2" => StopBits.Two, 
			"1.5" => StopBits.OnePointFive, 
			"0" => StopBits.None, 
			_ => StopBits.One, 
		};
	}
}
