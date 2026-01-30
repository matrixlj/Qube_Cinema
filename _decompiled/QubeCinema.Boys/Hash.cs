using System;

namespace QubeCinema.Boys;

public class Hash
{
	private byte[] _bytes;

	private string _base64String;

	private string _hexString;

	public byte[] Value => _bytes;

	public Hash(byte[] bytes)
	{
		_bytes = bytes;
	}

	public string ToBase64String()
	{
		if (_base64String == null)
		{
			_base64String = Convert.ToBase64String(_bytes);
		}
		return _base64String;
	}

	public string ToHexString()
	{
		if (_hexString == null)
		{
			_hexString = _ToHexString(_bytes);
		}
		return _hexString;
	}

	private string _ToHexString(byte[] bytes)
	{
		string text = string.Empty;
		for (int i = 0; i < bytes.Length; i++)
		{
			text += bytes[i].ToString("X2");
		}
		return text;
	}
}
