using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace Qube.Utils.Managed.Certificate;

public static class CertificateUtils
{
	public static X509Certificate2Collection ParseCertificates(string certificate)
	{
		X509Certificate2Collection x509Certificate2Collection = new X509Certificate2Collection();
		int length = "-----END CERTIFICATE-----".Length;
		int startIndex = 0;
		int num;
		while ((num = certificate.IndexOf("-----BEGIN CERTIFICATE-----", startIndex)) != -1)
		{
			int num2 = certificate.IndexOf("-----END CERTIFICATE-----", startIndex);
			if (num2 <= num)
			{
				break;
			}
			num2 += length;
			x509Certificate2Collection.Import(Encoding.ASCII.GetBytes(certificate.ToCharArray(num, num2 - num)));
			startIndex = num2;
		}
		return x509Certificate2Collection;
	}
}
