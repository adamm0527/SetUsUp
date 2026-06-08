using FluentAssertions;
using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Domain.Entities;

namespace Domain.UnitTests.DomainEntities;

public sealed class GroupTests
{
    [Fact]
    public void Check_Should_ReturnError_When_Name_NullOrEmpty()
    {
        // testing Domain breaching creation

        var resultGroupNullName = Group.Create(true, null!);
        resultGroupNullName.Error.Should().Be(Error.GroupNameEmpty);

        var resultGroupEmptyName = Group.Create(false, "");
        resultGroupEmptyName.Error.Should().Be(Error.GroupNameEmpty);

        var resultGroupEmptyAfterTrimmingName = Group.Create(false, "   ");
        resultGroupEmptyAfterTrimmingName.Error.Should().Be(Error.GroupNameEmpty);


        // testing Domain breaching mutation

        var resultGroupValid = Group.Create(false, "my group");
        resultGroupValid.HasSucceeded.Should().BeTrue();
        var validGroup = resultGroupValid.Value;
        validGroup.Should().NotBeNull();
        validGroup.IsUserCreated.Should().BeFalse();

        validGroup.SetName(null!).Error.Should().Be(Error.GroupNameEmpty);
        validGroup.SetName("").Error.Should().Be(Error.GroupNameEmpty);
        validGroup.SetName(" ").Error.Should().Be(Error.GroupNameEmpty);
        validGroup.SetName("   ").Error.Should().Be(Error.GroupNameEmpty);
    }

    [Fact]
    public void Check_Should_NotReturnError_When_Setting_Name()
    {
        var resultGroupValid = Group.Create(true, "our group");
        resultGroupValid.HasSucceeded.Should().BeTrue();
        var validGroup = resultGroupValid.Value;
        validGroup.Should().NotBeNull();

        // testing after creation
        validGroup.IsUserCreated.Should().BeTrue();
        validGroup.GetName().Should().Be("our group");

        // testing after mutation
        validGroup.SetName("our other group");
        validGroup.GetName().Should().Be("our other group");


        // the same checks when the group name is trimmed
        var resultGroupTrimmedValid = Group.Create(true, " trimmed group name   ");
        resultGroupTrimmedValid.HasSucceeded.Should().BeTrue();
        var validTrimmedGroup = resultGroupTrimmedValid.Value;
        validTrimmedGroup.Should().NotBeNull();

        validTrimmedGroup.IsUserCreated.Should().BeTrue();
        validTrimmedGroup.GetName().Should().Be("trimmed group name");

        validTrimmedGroup.SetName("   mutated trimmed group name ");
        validTrimmedGroup.GetName().Should().Be("mutated trimmed group name");
    }
}
