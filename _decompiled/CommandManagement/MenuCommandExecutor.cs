using System;
using System.Windows.Forms;

namespace CommandManagement;

public class MenuCommandExecutor : CommandExecutor
{
	public override void InstanceAdded(object item, Command cmd)
	{
		MenuItem menuItem = (MenuItem)item;
		menuItem.Click += menuItem_Click;
		base.InstanceAdded(item, cmd);
	}

	public override void Enable(object item, bool bEnable)
	{
		MenuItem menuItem = (MenuItem)item;
		menuItem.Enabled = bEnable;
	}

	public override void Check(object item, bool bCheck)
	{
		MenuItem menuItem = (MenuItem)item;
		menuItem.Checked = bCheck;
	}

	private void menuItem_Click(object sender, EventArgs e)
	{
		Command commandForInstance = GetCommandForInstance(sender);
		commandForInstance.Execute();
	}
}
