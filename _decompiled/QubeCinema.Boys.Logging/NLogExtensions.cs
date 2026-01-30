using System;
using System.ComponentModel;
using NLog;

namespace QubeCinema.Boys.Logging;

public static class NLogExtensions
{
	public static void SuccessAudit(this NLog.Logger logger, [Localizable(false)] string message, params object[] args)
	{
		logger.Info("[SuccessAudit]" + message, args);
	}

	public static void FailureAudit(this NLog.Logger logger, [Localizable(false)] string message, params object[] args)
	{
		logger.Error("[FailureAudit]" + message, args);
	}

	public static void FailureAuditException(this NLog.Logger logger, [Localizable(false)] string message, Exception exception)
	{
		logger.ErrorException("[FailureAudit]" + message, exception);
	}
}
