using System;

namespace QubeCinema.Boys;

public class HardLinkException : Exception
{
	public HardLinkException(string message)
		: base(message)
	{
	}
}
