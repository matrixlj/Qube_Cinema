using System;
using System.Windows.Forms;

namespace QubeCinema.Boys;

public class DeviceVolumeMonitor : IDisposable
{
	private DeviceMonitor fInternal;

	private IntPtr fHandle;

	private bool fDisposed;

	private bool fEnabled;

	public bool Enabled
	{
		get
		{
			return fEnabled;
		}
		set
		{
			if (!fEnabled && value)
			{
				if (fInternal.Handle == IntPtr.Zero)
				{
					fInternal.AssignHandle(fHandle);
				}
				fEnabled = true;
			}
			if (fEnabled && !value)
			{
				if (fInternal.Handle != IntPtr.Zero)
				{
					fInternal.ReleaseHandle();
				}
				fEnabled = false;
			}
		}
	}

	public event DeviceVolumeAction OnVolumeInserted;

	public event DeviceVolumeAction OnVolumeRemoved;

	public DeviceVolumeMonitor()
	{
		if (Form.ActiveForm != null)
		{
			fHandle = Form.ActiveForm.Handle;
		}
		Initialize();
	}

	public DeviceVolumeMonitor(IntPtr aHandle)
	{
		if (aHandle != IntPtr.Zero)
		{
			fHandle = aHandle;
		}
		Initialize();
	}

	private void Initialize()
	{
		fInternal = new DeviceMonitor(this);
		fDisposed = false;
		fEnabled = false;
		Enabled = true;
	}

	internal void TriggerEvents(bool aInserted, int aMask)
	{
		if (aInserted)
		{
			this.OnVolumeInserted(aMask);
		}
		else
		{
			this.OnVolumeRemoved(aMask);
		}
	}

	public char MaskToLogicalPaths(int aMask)
	{
		int i;
		for (i = 0; i < 26; i++)
		{
			if ((aMask & 1) != 0)
			{
				break;
			}
			aMask >>= 1;
		}
		return Convert.ToChar(i + 65);
	}

	public void Dispose()
	{
		Dispose(aDisposing: true);
		GC.SuppressFinalize(this);
	}

	protected virtual void Dispose(bool aDisposing)
	{
		if (!fDisposed && fInternal.Handle != IntPtr.Zero)
		{
			fInternal.ReleaseHandle();
			fInternal = null;
		}
		fDisposed = true;
	}

	~DeviceVolumeMonitor()
	{
		Dispose(aDisposing: false);
	}
}
