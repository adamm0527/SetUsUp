using FluentAssertions;
using SetUsUpBE.Domain.DomainEvents;

namespace Domain.UnitTests.DomainEvents;

public sealed class PlaylistOrderChangedTests
{
    [Fact]
    public void Check_Should_NotReturnError_Incrementing()
    {
        uint playlistCount = 15U, currNr = 1U, nextNr;
        var orderChangedEvent = PlaylistOrderChanged.Raise(playlistCount);
        orderChangedEvent.CurrNr.Should().Be(currNr);

        for (; currNr <= playlistCount; currNr++)
        {
            orderChangedEvent.Handled.Should().BeFalse();
            orderChangedEvent.CurrNr.Should().Be(currNr);
            orderChangedEvent.MaxNr.Should().Be(playlistCount);
            
            nextNr = orderChangedEvent.GetNextNr();
            nextNr.Should().Be(currNr);
        }

        orderChangedEvent.Handled.Should().BeTrue();
        orderChangedEvent.CurrNr.Should().Be(playlistCount + 1);
        orderChangedEvent.MaxNr.Should().Be(playlistCount);

        //// nothing should happen after it was handled

        if (!orderChangedEvent.Handled)
            nextNr = orderChangedEvent.GetNextNr();

        orderChangedEvent.Handled.Should().BeTrue();
        orderChangedEvent.CurrNr.Should().Be(playlistCount + 1);
        orderChangedEvent.MaxNr.Should().Be(playlistCount);
    }

    [Fact]
    public void Check_Should_NotReturnError_ZeroHandled()
    {
        var orderChangedEvent = PlaylistOrderChanged.Raise(0U);
        orderChangedEvent.CurrNr.Should().Be(1U);
        orderChangedEvent.MaxNr.Should().Be(1U);
        orderChangedEvent.Handled.Should().BeTrue();

        // nothing should happen after it was handled

        if (!orderChangedEvent.Handled)
            _ = orderChangedEvent.GetNextNr();

        orderChangedEvent.Handled.Should().BeTrue();
        orderChangedEvent.CurrNr.Should().Be(1U);
        orderChangedEvent.MaxNr.Should().Be(1U);
    }
}
