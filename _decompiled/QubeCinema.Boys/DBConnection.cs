using System;
using System.Data;
using System.Data.SqlClient;

namespace QubeCinema.Boys;

public class DBConnection : IDisposable
{
	private SqlConnection _connection;

	private SqlTransaction _transaction;

	public SqlTransaction Transaction
	{
		get
		{
			lock (_connection)
			{
				return _transaction;
			}
		}
	}

	public SqlConnection Connection
	{
		get
		{
			lock (_connection)
			{
				return _connection;
			}
		}
	}

	public DBConnection(string connectionString)
	{
		_connection = new SqlConnection(connectionString);
		_connection.Open();
	}

	public void BeginTran()
	{
		lock (_connection)
		{
			_transaction = _connection.BeginTransaction();
		}
	}

	public void Commit()
	{
		lock (_connection)
		{
			if (_transaction != null)
			{
				_transaction.Commit();
				_transaction = null;
			}
		}
	}

	public void RollBack()
	{
		lock (_connection)
		{
			if (_transaction != null)
			{
				_transaction.Rollback();
				_transaction = null;
			}
		}
	}

	public bool IsConnection()
	{
		lock (_connection)
		{
			return _transaction == null;
		}
	}

	public void Close()
	{
		lock (_connection)
		{
			if (_connection.State != ConnectionState.Closed)
			{
				_connection.Close();
			}
		}
	}

	public DBConnection(SqlConnection connection)
	{
		_connection = connection;
	}

	public DBConnection(SqlTransaction transaction)
	{
		_transaction = transaction;
	}

	public void Dispose()
	{
		Close();
		GC.SuppressFinalize(this);
	}
}
