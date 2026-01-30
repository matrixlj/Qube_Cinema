using System;
using System.Text;

namespace QubeCinema.Boys;

public class Timecode
{
	private const int TICKS_PER_SECOND = 250;

	private int _frames;

	private decimal _fps;

	private string _format;

	public decimal Fps => _fps;

	public int Frames
	{
		get
		{
			return _frames;
		}
		set
		{
			_frames = value;
		}
	}

	public decimal Seconds
	{
		get
		{
			return (decimal)_frames / _fps;
		}
		set
		{
			_frames = (int)Math.Round((double)(value * _fps));
		}
	}

	public Timecode(decimal fps, int frames)
	{
		_fps = fps;
		_format = "{0:0#}:{1:0#}:{2:0#}:{3:";
		for (int num = Convert.ToInt32(fps - 1m); num >= 10; num /= 10)
		{
			_format += "0";
		}
		_format += "#}";
		_frames = frames;
	}

	public int SetFromBCD(uint bcd)
	{
		byte b = Convert.ToByte(bcd >> 24);
		_frames = ((b >> 4) * 10 + (b & 0xF)) * 3600;
		b = Convert.ToByte(bcd >> 16);
		_frames += ((b >> 4) * 10 + (b & 0xF)) * 60;
		b = Convert.ToByte(bcd >> 8);
		_frames += (b >> 4) * 10 + (b & 0xF);
		b = Convert.ToByte(bcd);
		b = Convert.ToByte((b >> 4) * 10 + (b & 0xF));
		return Convert.ToInt32(_frames = Convert.ToInt32((decimal)_frames * _fps) + b);
	}

	public string GetHM()
	{
		StringBuilder stringBuilder = new StringBuilder();
		try
		{
			int h = 0;
			int m = 0;
			int s = 0;
			int f = 0;
			_HMSF(out h, out m, out s, out f);
			if (_frames >= 0)
			{
				stringBuilder.AppendFormat("{0:0#}:{1:0#}", Math.Abs(h), Math.Abs(m));
			}
			else
			{
				stringBuilder.AppendFormat("-{0:0#}:{1:0#}", Math.Abs(h), Math.Abs(m));
			}
		}
		catch (Exception)
		{
			stringBuilder.AppendFormat("{0:0#}:{1:0#}", 0, 0);
		}
		return stringBuilder.ToString();
	}

	public string GetHMS()
	{
		StringBuilder stringBuilder = new StringBuilder();
		try
		{
			int h = 0;
			int m = 0;
			int s = 0;
			int f = 0;
			_HMSF(out h, out m, out s, out f);
			if (_frames >= 0)
			{
				stringBuilder.AppendFormat("{0:0#}:{1:0#}:{2:0#}", Math.Abs(h), Math.Abs(m), Math.Abs(s));
			}
			else
			{
				stringBuilder.AppendFormat("-{0:0#}:{1:0#}:{2:0#}", Math.Abs(h), Math.Abs(m), Math.Abs(s));
			}
		}
		catch (Exception)
		{
			stringBuilder.AppendFormat("{0:0#}:{1:0#}:{2:0#}", 0, 0, 0);
		}
		return stringBuilder.ToString();
	}

	public string GetHMSF()
	{
		StringBuilder stringBuilder = new StringBuilder();
		try
		{
			int h = 0;
			int m = 0;
			int s = 0;
			int f = 0;
			_HMSF(out h, out m, out s, out f);
			if (_frames >= 0)
			{
				stringBuilder.AppendFormat(_format, Math.Abs(h), Math.Abs(m), Math.Abs(s), Math.Abs(f));
			}
			else
			{
				stringBuilder.AppendFormat("-" + _format, Math.Abs(h), Math.Abs(m), Math.Abs(s), Math.Abs(f));
			}
		}
		catch (Exception)
		{
			stringBuilder.AppendFormat("{0:0#}:{1:0#}:{2:0#}:{3:00#}", 0, 0, 0, 0);
		}
		return stringBuilder.ToString();
	}

	public void SetHMSF(string tc)
	{
		_frames = 0;
		string text = tc.Trim(' ');
		string[] array = text.Split(':', '.', ',');
		int num = 1;
		for (int num2 = array.Length - 2; num2 >= 0; num2--)
		{
			if (array[num2] == string.Empty)
			{
				array[num2] = "0";
			}
			try
			{
				_frames += Convert.ToInt32(array[num2]) * num;
			}
			catch (Exception)
			{
			}
			num *= 60;
		}
		int num3 = (int)Math.Ceiling((double)_fps);
		_frames = Convert.ToInt32(_frames * num3) + ((array.Length != 0) ? Convert.ToInt32(array[array.Length - 1]) : 0);
	}

	public void GetHMSF(out int h, out int m, out int s, out int f)
	{
		_HMSF(out h, out m, out s, out f);
	}

	public string GetHMST()
	{
		StringBuilder stringBuilder = new StringBuilder();
		try
		{
			int h = 0;
			int m = 0;
			int s = 0;
			int t = 0;
			GetHMST(out h, out m, out s, out t);
			string text = "{0:0#}:{1:0#}:{2:0#}:{3:00#}";
			if (_frames >= 0)
			{
				stringBuilder.AppendFormat(text, Math.Abs(h), Math.Abs(m), Math.Abs(s), Math.Abs(t));
			}
			else
			{
				stringBuilder.AppendFormat("-" + text, Math.Abs(h), Math.Abs(m), Math.Abs(s), Math.Abs(t));
			}
		}
		catch (Exception)
		{
			stringBuilder.AppendFormat("{0:0#}:{1:0#}:{2:0#}:{3:00#}", 0, 0, 0, 0);
		}
		return stringBuilder.ToString();
	}

	public void GetHMST(out int h, out int m, out int s, out int t)
	{
		_HMSF(out h, out m, out s, out var f);
		t = (int)((decimal)f / _fps * 250m);
	}

	public void SetHMSF(int h, int m, int s, int f)
	{
		int num = (int)Math.Ceiling((double)_fps);
		_frames = h * 3600 * num + m * 60 * num + s * num + f;
	}

	private void _HMSF(out int h, out int m, out int s, out int f)
	{
		h = (m = (s = (f = 0)));
		if (_frames != 0 && !(_fps == 0m))
		{
			int num = (int)Math.Ceiling((double)_fps);
			f = _frames;
			h = f / (3600 * num);
			f %= 3600 * num;
			m = f / (60 * num);
			f %= 60 * num;
			s = f / num;
			f %= num;
		}
	}
}
