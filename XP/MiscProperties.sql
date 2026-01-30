use [Qube]
go

insert into Properties(Id, Scope, [Name], XSD, XSDElement) values('DDEA66B1-7AD8-4bf1-A092-F972C1DC6564', 1, 'ShowPlayType', NULL, NULL)
go

insert into Properties(Id, Scope, [Name], XSD, XSDElement) values('B641B9A2-0D47-4a69-9EF2-ED895C72096E', 1, 'ShowSequence', NULL, NULL)
go



insert into PropertyValues(Property, [Time], Value) values('DDEA66B1-7AD8-4bf1-A092-F972C1DC6564', '1753-01-01 12:00:00', 'test')
go

insert into PropertyValues(Property, [Time], Value) values('B641B9A2-0D47-4a69-9EF2-ED895C72096E', '1753-01-01 12:00:00', '0')
go

