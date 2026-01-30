using System;
using System.Web.Script.Services;
using System.Web.Services;

namespace Qube.Mama;

[ScriptService]
[WebService(Namespace = "http://webservices.qubecinema.com/XP/Maintenance/2008-10-15/")]
[WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
public class Maintenance : WebService
{
	[WebMethod]
	public void ShutDown()
	{
		try
		{
			ITaskManager velaikaran = Utils.GetVelaikaran();
			velaikaran.Shutdown(ShutdownMethod.ShutDown);
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Maintenance");
		}
	}

	[WebMethod]
	public void Restart()
	{
		try
		{
			ITaskManager velaikaran = Utils.GetVelaikaran();
			velaikaran.Shutdown(ShutdownMethod.Reboot);
		}
		catch (Exception ex)
		{
			Diagnostics.LogError(ex.ToString());
			throw new SoapException(ex.Message, ex, base.Context, "Maintenance");
		}
	}
}
