using System;
using System.Runtime.InteropServices;

namespace QubeCinema.Boys;

public class PerformanceCounter
{
	private long _start;

	[DllImport("kernel32.dll")]
	public static extern short QueryPerformanceCounter(ref long x);

	[DllImport("kernel32.dll")]
	public static extern short QueryPerformanceFrequency(ref long x);

	public PerformanceCounter()
	{
		Reset();
	}

	public TimeSpan HowLong()
	{
		long x = 0L;
		QueryPerformanceCounter(ref x);
		return new TimeSpan(x - _start);
	}

	public void Reset()
	{
		QueryPerformanceCounter(ref _start);
	}
}
