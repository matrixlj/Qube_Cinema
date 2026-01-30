using System.Collections;

namespace CommandManagement;

public abstract class CommandExecutor
{
	protected Hashtable hashInstances = new Hashtable();

	public virtual void InstanceAdded(object item, Command cmd)
	{
		hashInstances.Add(item, cmd);
	}

	protected Command GetCommandForInstance(object item)
	{
		return hashInstances[item] as Command;
	}

	public abstract void Enable(object item, bool bEnable);

	public abstract void Check(object item, bool bCheck);
}
