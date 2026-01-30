using System;
using System.IO;
using System.Text;
using System.Xml;
using System.Xml.XPath;
using NLog;

namespace Qube.Utils.Managed.Dcp;

public static class DcpUtils
{
	private static Logger _logger = LogManager.GetCurrentClassLogger();

	public static string GetDisplayName(string contentTitleText, string annotationText, Guid id)
	{
		string text = contentTitleText;
		if (string.IsNullOrEmpty(text))
		{
			text = (string.IsNullOrEmpty(annotationText) ? $"Unnamed-{id}" : annotationText);
		}
		return text;
	}

	public static bool Has2397EditRateContents(string cplText)
	{
		using (StringReader textReader = new StringReader(cplText))
		{
			XPathDocument xPathDocument = new XPathDocument(textReader);
			XPathNavigator xPathNavigator = xPathDocument.CreateNavigator();
			XPathExpression expr = xPathNavigator.Compile("//*[local-name() = 'ReelList']/*[local-name() = 'Reel']/*[local-name() ='AssetList']/*/*[local-name() ='EditRate']");
			XPathNodeIterator xPathNodeIterator = xPathNavigator.Select(expr);
			while (xPathNodeIterator.MoveNext())
			{
				decimal num = _GetEditRateQuotient(xPathNodeIterator.Current.Value);
				if (num >= 23.97m && num <= 23.99m)
				{
					return true;
				}
			}
		}
		return false;
	}

	private static decimal _GetEditRateQuotient(string editRate)
	{
		string[] array = editRate.Trim().Split(' ');
		int num = int.Parse(array[0]);
		int num2 = 1;
		if (array.Length > 1)
		{
			num2 = int.Parse(array[1]);
		}
		return (decimal)num / (decimal)num2;
	}

	public static string NormalizeReelDurations(string cplText)
	{
		StringBuilder stringBuilder = new StringBuilder();
		XmlDocument xmlDocument = new XmlDocument();
		xmlDocument.LoadXml(cplText);
		XPathNavigator xPathNavigator = xmlDocument.CreateNavigator();
		string argument = _GetCplId(xPathNavigator);
		XPathNodeIterator xPathNodeIterator = xPathNavigator.Select("//*[local-name() = 'ReelList']/*[local-name() = 'Reel']/*[local-name() ='AssetList']");
		foreach (XPathNavigator item in xPathNodeIterator)
		{
			int videoDuration = 0;
			int audioDuration = 0;
			XmlNode node = ((IHasXmlNode)item).GetNode();
			_GetVideoAudioDuration(node.ChildNodes, out videoDuration, out audioDuration);
			if (audioDuration != 0 && videoDuration != audioDuration)
			{
				int num = Math.Min(videoDuration, audioDuration);
				_UpdateDuration(node.ChildNodes, num);
				string arg = _GetReelId(node.ParentNode);
				stringBuilder.AppendLine($"Reel: \"{arg}\" Duration corrected to {num}");
			}
		}
		if (stringBuilder.Length > 0)
		{
			_logger.Info("Video Audio duration mismatch in CPL: \"{0}\", {1}", argument, stringBuilder.ToString());
			return xmlDocument.InnerXml;
		}
		return cplText;
	}

	private static string _GetCplId(XPathNavigator nav)
	{
		XPathNodeIterator xPathNodeIterator = nav.Select("//*[local-name() = 'CompositionPlaylist']/*[local-name() = 'Id']");
		xPathNodeIterator.MoveNext();
		XmlNode node = ((IHasXmlNode)xPathNodeIterator.Current).GetNode();
		return node.FirstChild.InnerText;
	}

	private static string _GetReelId(XmlNode reelNode)
	{
		return reelNode.SelectSingleNode("./*[local-name() = 'Id']").InnerText;
	}

	private static void _GetVideoAudioDuration(XmlNodeList assetNodeList, out int videoDuration, out int audioDuration)
	{
		videoDuration = 0;
		audioDuration = 0;
		for (int i = 0; i < assetNodeList.Count; i++)
		{
			XmlNode xmlNode = assetNodeList.Item(i);
			if (xmlNode.LocalName == "MainPicture" || xmlNode.LocalName == "MainStereoscopicPicture")
			{
				videoDuration = _GetEssenceDuration(xmlNode.ChildNodes);
			}
			else if (xmlNode.LocalName == "MainSound")
			{
				audioDuration = _GetEssenceDuration(xmlNode.ChildNodes);
			}
		}
	}

	private static int _GetEssenceDuration(XmlNodeList nodeList)
	{
		int num = 0;
		int num2 = 0;
		for (int i = 0; i < nodeList.Count; i++)
		{
			if (nodeList.Item(i).LocalName == "Duration")
			{
				return Convert.ToInt32(nodeList.Item(i).InnerText);
			}
			if (nodeList.Item(i).LocalName == "IntrinsicDuration")
			{
				num = Convert.ToInt32(nodeList.Item(i).InnerText);
			}
			else if (nodeList.Item(i).LocalName == "EntryPoint")
			{
				num2 = Convert.ToInt32(nodeList.Item(i).InnerText);
			}
		}
		return num - num2;
	}

	private static void _UpdateDuration(XmlNodeList nodeList, int newDuration)
	{
		for (int i = 0; i < nodeList.Count; i++)
		{
			XmlNode xmlNode = nodeList.Item(i);
			_SetEssenceDuration(xmlNode.ChildNodes, newDuration);
		}
	}

	private static void _SetEssenceDuration(XmlNodeList assetNodeList, int newDuration)
	{
		int num = 0;
		XmlNode xmlNode = null;
		for (int i = 0; i < assetNodeList.Count; i++)
		{
			if (assetNodeList.Item(i).LocalName == "Duration")
			{
				xmlNode = assetNodeList.Item(i);
			}
			else if (assetNodeList.Item(i).LocalName == "IntrinsicDuration")
			{
				if (xmlNode == null)
				{
					xmlNode = assetNodeList.Item(i);
				}
			}
			else if (assetNodeList.Item(i).LocalName == "EntryPoint")
			{
				num = Convert.ToInt32(assetNodeList.Item(i).InnerText);
			}
		}
		if (xmlNode.LocalName == "Duration")
		{
			int num2 = Convert.ToInt32(xmlNode.InnerText);
			if (num2 > newDuration)
			{
				xmlNode.InnerText = newDuration.ToString();
			}
			return;
		}
		int num3 = Convert.ToInt32(xmlNode.InnerText);
		int num4 = num3 - num;
		if (num4 > newDuration)
		{
			xmlNode.InnerText = (num + newDuration).ToString();
		}
	}
}
