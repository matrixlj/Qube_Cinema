namespace QubeCinema.Boys;

public class BitTwiddler
{
	public static byte SetBit(byte number, byte bitPosition)
	{
		return number |= (byte)(1 << (int)bitPosition);
	}

	public static byte ClearBit(byte number, byte bitPosition)
	{
		return number &= (byte)(~(1 << (int)bitPosition));
	}

	public static bool GetBit(byte number, byte bitPosition)
	{
		return (number & (1 << (int)bitPosition)) == 1 << (int)bitPosition;
	}

	public static byte ToggleBit(byte number, byte bitPosition)
	{
		return number ^= (byte)(1 << (int)bitPosition);
	}
}
