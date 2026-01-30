using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace QubeCinema.Boys;

internal class DeviceMonitor : NativeWindow
{
	public enum DeviceEvent
	{
		Arrival = 32768,
		QueryRemove,
		QueryRemoveFailed,
		RemovePending,
		RemoveComplete,
		Specific,
		Custom
	}

	public enum DeviceType
	{
		OEM,
		DeviceNode,
		Volume,
		Port,
		Net
	}

	public enum VolumeFlags
	{
		Media = 1,
		Net
	}

	public struct BroadcastHeader
	{
		public int Size;

		public DeviceType Type;

		private int Reserved;
	}

	public struct Volume
	{
		public int Size;

		public DeviceType Type;

		private int Reserved;

		public int Mask;

		public int Flags;
	}

	public struct Port
	{
		public int Size;

		public DeviceType Type;

		private int Reserved;

		public string Name;
	}

	private const int WM_DEVICECHANGE = 537;

	private DeviceVolumeMonitor fMonitor;

	public DeviceMonitor(DeviceVolumeMonitor aMonitor)
	{
		fMonitor = aMonitor;
	}

	protected override void WndProc(ref Message aMessage)
	{
		base.WndProc(ref aMessage);
		if (aMessage.Msg != 537)
		{
			return;
		}
		DeviceEvent deviceEvent = (DeviceEvent)aMessage.WParam.ToInt32();
		if (deviceEvent == DeviceEvent.Arrival || deviceEvent == DeviceEvent.RemoveComplete)
		{
			BroadcastHeader broadcastHeader = (BroadcastHeader)Marshal.PtrToStructure(aMessage.LParam, typeof(BroadcastHeader));
			if (broadcastHeader.Type == DeviceType.Volume)
			{
				Volume volume = (Volume)Marshal.PtrToStructure(aMessage.LParam, typeof(Volume));
				fMonitor.TriggerEvents(deviceEvent == DeviceEvent.Arrival, volume.Mask);
			}
			if (broadcastHeader.Type == DeviceType.Port)
			{
				_ = (Port)Marshal.PtrToStructure(aMessage.LParam, typeof(Port));
				fMonitor.TriggerEvents(deviceEvent == DeviceEvent.Arrival, 0);
			}
		}
	}
}
