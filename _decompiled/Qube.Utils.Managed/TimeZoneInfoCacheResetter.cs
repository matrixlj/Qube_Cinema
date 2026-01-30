using System;
using Microsoft.Win32;
using Qube.Utils.Managed.Registry;

namespace Qube.Utils.Managed;

public class TimeZoneInfoCacheResetter : IDisposable
{
	public delegate void TimeZoneInfoCacheResettedHandler();

	private const string TIME_ZONE_INFO_REG_KEY = "SYSTEM\\CurrentControlSet\\Control\\TimeZoneInformation";

	private RegistryMonitor _registryMonitor;

	public bool IsRunning => _registryMonitor.IsMonitoring;

	public event TimeZoneInfoCacheResettedHandler TimeZoneInfoCacheResetted;

	public TimeZoneInfoCacheResetter()
	{
		_registryMonitor = new RegistryMonitor(RegistryHive.LocalMachine, "SYSTEM\\CurrentControlSet\\Control\\TimeZoneInformation");
		_registryMonitor.RegChanged += _OnTimeZoneInfoRegKeyChanged;
	}

	public void Start()
	{
		_registryMonitor.Start();
	}

	public void Stop()
	{
		_registryMonitor.Stop();
	}

	public void Dispose()
	{
		_Dispose(isDisposing: true);
	}

	private void _Dispose(bool isDisposing)
	{
		if (isDisposing && _registryMonitor != null)
		{
			if (_registryMonitor.IsMonitoring)
			{
				_registryMonitor.Stop();
			}
			RegistryMonitor registryMonitor = _registryMonitor;
			_registryMonitor = null;
			registryMonitor.Dispose();
		}
	}

	private void _OnTimeZoneInfoRegKeyChanged(object sender, EventArgs e)
	{
		TimeZoneInfo.ClearCachedData();
		if (this.TimeZoneInfoCacheResetted != null)
		{
			this.TimeZoneInfoCacheResetted();
		}
	}
}
