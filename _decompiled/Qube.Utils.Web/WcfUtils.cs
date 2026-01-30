using System;
using System.ServiceModel;
using System.ServiceModel.Description;
using NLog;

namespace Qube.Utils.Web;

public class WcfUtils
{
	private static Logger _logger = LogManager.GetCurrentClassLogger();

	public static ServiceHost HostService(string ipAddress, string endPointAddress, Type serviceContract, Type dataContract)
	{
		Uri uri = new Uri($"http://{ipAddress}:8080/{endPointAddress}");
		_logger.Trace("Hosting {0}", uri.AbsoluteUri);
		ServiceHost serviceHost = new ServiceHost(serviceContract, uri);
		ServiceMetadataBehavior serviceMetadataBehavior = new ServiceMetadataBehavior();
		serviceMetadataBehavior.HttpGetEnabled = true;
		ServiceMetadataBehavior item = serviceMetadataBehavior;
		serviceHost.Description.Behaviors.Add(item);
		serviceHost.AddServiceEndpoint(dataContract, new BasicHttpBinding("serviceBinding"), uri);
		serviceHost.AddServiceEndpoint("IMetadataExchange", MetadataExchangeBindings.CreateMexHttpBinding(), "mex");
		serviceHost.Open();
		return serviceHost;
	}
}
