using System.Data;
using System.Data.SqlClient;
using Microsoft;

namespace QubeCinema.Boys;

public sealed class SqlHelper
{
	private SqlHelper()
	{
	}

	public static int ExecuteNonQuery(DBConnection c, CommandType commandType, string commandText)
	{
		lock (c)
		{
			if (c.IsConnection())
			{
				return Microsoft.SqlHelper.ExecuteNonQuery(c.Connection, commandType, commandText);
			}
			return Microsoft.SqlHelper.ExecuteNonQuery(c.Transaction, commandType, commandText);
		}
	}

	public static int ExecuteNonQuery(DBConnection c, CommandType commandType, string commandText, params SqlParameter[] commandParameters)
	{
		lock (c)
		{
			if (c.IsConnection())
			{
				return Microsoft.SqlHelper.ExecuteNonQuery(c.Connection, commandType, commandText, commandParameters);
			}
			return Microsoft.SqlHelper.ExecuteNonQuery(c.Transaction, commandType, commandText, commandParameters);
		}
	}

	public static int ExecuteNonQuery(DBConnection c, string spName, params object[] parameterValues)
	{
		lock (c)
		{
			if (c.IsConnection())
			{
				return Microsoft.SqlHelper.ExecuteNonQuery(c.Connection, spName, parameterValues);
			}
			return Microsoft.SqlHelper.ExecuteNonQuery(c.Transaction, spName, parameterValues);
		}
	}

	public static DataSet ExecuteDataset(DBConnection c, CommandType commandType, string commandText)
	{
		lock (c)
		{
			if (c.IsConnection())
			{
				return Microsoft.SqlHelper.ExecuteDataset(c.Connection, commandType, commandText);
			}
			return Microsoft.SqlHelper.ExecuteDataset(c.Transaction, commandType, commandText);
		}
	}

	public static DataSet ExecuteDataset(DBConnection c, CommandType commandType, string commandText, params SqlParameter[] commandParameters)
	{
		lock (c)
		{
			if (c.IsConnection())
			{
				return Microsoft.SqlHelper.ExecuteDataset(c.Connection, commandType, commandText, commandParameters);
			}
			return Microsoft.SqlHelper.ExecuteDataset(c.Transaction, commandType, commandText, commandParameters);
		}
	}

	public static DataSet ExecuteDataset(DBConnection c, string spName, params object[] parameterValues)
	{
		lock (c)
		{
			if (c.IsConnection())
			{
				return Microsoft.SqlHelper.ExecuteDataset(c.Connection, spName, parameterValues);
			}
			return Microsoft.SqlHelper.ExecuteDataset(c.Transaction, spName, parameterValues);
		}
	}

	public static object ExecuteScalar(DBConnection c, CommandType commandType, string commandText)
	{
		lock (c)
		{
			if (c.IsConnection())
			{
				return Microsoft.SqlHelper.ExecuteScalar(c.Connection, commandType, commandText);
			}
			return Microsoft.SqlHelper.ExecuteScalar(c.Transaction, commandType, commandText);
		}
	}

	public static object ExecuteScalar(DBConnection c, CommandType commandType, string commandText, params SqlParameter[] commandParameters)
	{
		lock (c)
		{
			if (c.IsConnection())
			{
				return Microsoft.SqlHelper.ExecuteScalar(c.Connection, commandType, commandText, commandParameters);
			}
			return Microsoft.SqlHelper.ExecuteScalar(c.Transaction, commandType, commandText, commandParameters);
		}
	}

	public static object ExecuteScalar(DBConnection c, string spName, params object[] parameterValues)
	{
		lock (c)
		{
			if (c.IsConnection())
			{
				return Microsoft.SqlHelper.ExecuteScalar(c.Connection, spName, parameterValues);
			}
			return Microsoft.SqlHelper.ExecuteScalar(c.Transaction, spName, parameterValues);
		}
	}

	public static void FillDataset(DBConnection c, CommandType commandType, string commandText, DataSet dataSet, string[] tableNames)
	{
		lock (c)
		{
			if (c.IsConnection())
			{
				Microsoft.SqlHelper.FillDataset(c.Connection, commandType, commandText, dataSet, tableNames);
			}
			else
			{
				Microsoft.SqlHelper.FillDataset(c.Transaction, commandType, commandText, dataSet, tableNames);
			}
		}
	}

	public static void FillDataset(DBConnection c, CommandType commandType, string commandText, DataSet dataSet, string[] tableNames, params SqlParameter[] commandParameters)
	{
		lock (c)
		{
			if (c.IsConnection())
			{
				Microsoft.SqlHelper.FillDataset(c.Connection, commandType, commandText, dataSet, tableNames, commandParameters);
			}
			else
			{
				Microsoft.SqlHelper.FillDataset(c.Transaction, commandType, commandText, dataSet, tableNames, commandParameters);
			}
		}
	}

	public static void FillDataset(DBConnection c, string spName, DataSet dataSet, string[] tableNames, params object[] parameterValues)
	{
		lock (c)
		{
			if (c.IsConnection())
			{
				Microsoft.SqlHelper.FillDataset(c.Connection, spName, dataSet, tableNames, parameterValues);
			}
			else
			{
				Microsoft.SqlHelper.FillDataset(c.Transaction, spName, dataSet, tableNames, parameterValues);
			}
		}
	}
}
