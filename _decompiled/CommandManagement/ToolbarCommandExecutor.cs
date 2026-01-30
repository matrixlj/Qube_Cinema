using System.Windows.Forms;

namespace CommandManagement;

public class ToolbarCommandExecutor : CommandExecutor
{
	public override void InstanceAdded(object item, Command cmd)
	{
		ToolBarButton toolBarButton = (ToolBarButton)item;
		ToolBarButtonClickEventHandler value = toolbar_ButtonClick;
		toolBarButton.Parent.ButtonClick -= value;
		toolBarButton.Parent.ButtonClick += value;
		base.InstanceAdded(item, cmd);
	}

	public override void Enable(object item, bool bEnable)
	{
		ToolBarButton toolBarButton = (ToolBarButton)item;
		toolBarButton.Enabled = bEnable;
	}

	public override void Check(object item, bool bCheck)
	{
		ToolBarButton toolBarButton = (ToolBarButton)item;
		toolBarButton.Style = ToolBarButtonStyle.ToggleButton;
		toolBarButton.Pushed = bCheck;
	}

	private void toolbar_ButtonClick(object sender, ToolBarButtonClickEventArgs args)
	{
		Command commandForInstance = GetCommandForInstance(args.Button);
		commandForInstance.Execute();
	}
}
