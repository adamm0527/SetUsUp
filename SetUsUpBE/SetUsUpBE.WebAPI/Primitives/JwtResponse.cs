namespace SetUsUpBE.WebAPI.Primitives;

public sealed record JwtResponse(string Token, DateTime ValidTo)
{
}
