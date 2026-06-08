using SetUsUpBE.Application.ServiceInterfaces;
using SetUsUpBE.Application.Services.Primitives;
using SetUsUpBE.Application.Services;
using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Application.DTOs.Inbound;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.WebAPI.Primitives;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http.Extensions;

namespace SetUsUpBE.WebAPI.Controllers;

[Authorize]
[Route("groups")]
[ApiController]
public sealed class GroupController : ControllerBase
{
    private readonly MembershipService mshipService;
    private readonly MusicService musicService;
    private readonly IUserService userService;

    public GroupController(MembershipService mshipService, MusicService musicService, IUserService userService)
    {
        this.musicService = musicService;
        this.mshipService = mshipService;
        this.userService = userService;
    }

    // CREATE

    [HttpPost]
    [ProducesResponseType<Response>(StatusCodes.Status201Created)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> CreateGroupAsync([FromBody] CreateGroupDto dto)
    {
        string userId = AuthenticationController.GetUserId(this.User.Identity);
        List<IAppUser> newMembers = new List<IAppUser>();
        foreach (string memberName in dto.MemberNames.Distinct())
        {
            var newMember = await userService.GetUserByUserNameAsync(memberName);

            if (newMember is null)
                    return ApiResults.NotFound_404(QueryError.CreateUserNonExistentError(memberName));
            else
            {
                if (newMember.Id == userId)
                    return ApiResults.BadRequest_400(QueryError.UserCreatorDuplicateMembership);

                newMembers.Add(newMember);
            }
        }

        var user = await userService.GetUserByIdAsync(userId);
        var groupResult = await musicService.AddGroupAsync(dto, user!, newMembers, userService);
        if (groupResult.HasFailed)
                    return ApiResults.BadRequest_400(groupResult.Error);

        return ApiResults.Created_201(
            location: Url.ActionContext.HttpContext.Request.GetEncodedUrl() + "/" + groupResult!.Value!.Id,
            response: new Response("TagGroup.CreateSuccess", "TagGroup successfully created.")
        );
    }

    // READ

    [HttpGet("{id}")]
    [ProducesResponseType<ReadGroupDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> GetByIdAsync(Guid id)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var groupDtoResult = await musicService.GetGroupDtoByIdAsync(id, queryUserId);
        if (groupDtoResult.HasFailed)
        {
            if (groupDtoResult.Error == QueryError.GroupNonExistentId)
                return ApiResults.NotFound_404(groupDtoResult.Error);

            if (groupDtoResult.Error == QueryError.GroupNoAccess)
                return ApiResults.Forbidden_403(groupDtoResult.Error);
        }
        return ApiResults.Ok_200(groupDtoResult.Value!);
    }


    [HttpGet]
    [ProducesResponseType<ReadGroupDto>(StatusCodes.Status200OK)]
    public async Task<IResult> GetAllUserGroupsAsync()
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var groupDtos = await musicService.GetGroupDtosByUserAsync(queryUserId);
        return ApiResults.Ok_200(groupDtos);
    }

    // UPDATE

    [HttpPatch("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<Response>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IResult> UpdateGroupNameAsync(Guid id, [FromBody] UpdateGroupNameDto dto)
    {
        var userId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(userId);
        var updateResult = await musicService.UpdateGroupNameAsync(id, user!, dto.NewGroupName);
        if (updateResult.HasFailed)
        {
            if (updateResult.Error == QueryError.GroupNonExistentId)
                return ApiResults.NotFound_404(updateResult.Error);

            if (updateResult.Error == QueryError.UserNotCreatorInGroup)
                return ApiResults.Forbidden_403(updateResult.Error);

            if (updateResult.Error == QueryError.GroupOwnCollectionRename)
                return ApiResults.UnprocessableEntity_422(updateResult.Error);

            return ApiResults.BadRequest_400(updateResult.Error); // domain infringement
        }

        return ApiResults.NoContent_204();
    }


    [HttpPost("{groupId}/users/{newUserName}")]
    [ProducesResponseType<Response>(StatusCodes.Status201Created)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<Response>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IResult> InviteUserToGroupAsync(Guid groupId, string newUserName)
    {
        if (!await musicService.GroupExistsAsync(groupId))
            return ApiResults.NotFound_404(QueryError.GroupNonExistentId);

        var newUser = await userService.GetUserByUserNameAsync(newUserName);
        if (newUser is null)
            return ApiResults.NotFound_404(QueryError.CreateUserNonExistentError(newUserName));

        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var isAtLeastAdminResult = await mshipService.IsAtLeastAdminAsync(queryUserId, groupId);
        if (isAtLeastAdminResult.HasFailed)
            return ApiResults.Forbidden_403(QueryError.GroupNoAccess);

        if (!isAtLeastAdminResult.Value!)
            return ApiResults.Forbidden_403(QueryError.UserNotAdminInGroup);

        var queryUser = await userService.GetUserByIdAsync(queryUserId);
        if (queryUser!.OwnGroupId == groupId)
            return ApiResults.UnprocessableEntity_422(QueryError.GroupOneUserOnlyInvitation);

        if (await mshipService.IsMemberAsync(newUser.Id, groupId))
            return ApiResults.UnprocessableEntity_422(QueryError.GroupMemberAlreadyAdded);


        await mshipService.AddNonAdminMembershipAsync(newUser.Id, groupId);
        return ApiResults.Created_201(null!,
            new Response("TagGroup.InvitationSuccess", $"Successfully added new member to the group.")
        );
    }


    [HttpPatch("{groupId}/users/{targetUserId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<Response>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IResult> UpdateUserRoleAsync(Guid groupId, string targetUserId,
        [FromBody] UpdateGroupUserAdminStatusDto dto)
    {
        if (!await musicService.GroupExistsAsync(groupId))
            return ApiResults.NotFound_404(QueryError.GroupNonExistentId);

        var targetUser = await userService.GetUserByIdAsync(targetUserId);
        if (targetUser is null)
            return ApiResults.NotFound_404(QueryError.UserNonExistentId);

        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var isCreator = await mshipService.IsCreatorAsync(queryUserId, groupId);
        if (!isCreator) // only the creator can give/revoke Admin roles in their group
            return ApiResults.Forbidden_403(QueryError.UserNotCreatorInGroup);

        if (!await mshipService.IsMemberAsync(targetUserId, groupId))
            return ApiResults.UnprocessableEntity_422(QueryError.GroupNonExistentMember);

        if (queryUserId == targetUserId)
            return ApiResults.UnprocessableEntity_422(QueryError.GroupCreatorAdminRevoke);


        await mshipService.UpdateUserAdminStatusAsync(targetUserId, groupId, dto.IsPromotion);
        return ApiResults.NoContent_204();
    }

    // DELETE

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<Response>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IResult> DeleteGroupAsync(Guid id)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var groupDeleteResult = await musicService.DeleteGroupAsync(id, user!, userService);
        if (groupDeleteResult.HasFailed)
        {
            if (groupDeleteResult.Error == QueryError.GroupNonExistentId)
                return ApiResults.NotFound_404(groupDeleteResult.Error);

            if (groupDeleteResult.Error == QueryError.UserNotCreatorInGroup)
                return ApiResults.Forbidden_403(groupDeleteResult.Error);

            return ApiResults.UnprocessableEntity_422(groupDeleteResult.Error);
        }

        return ApiResults.NoContent_204();
    }


    [HttpDelete("{groupId}/users/{kickedUserId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<Response>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IResult> KickUserFromGroupAsync(Guid groupId, string kickedUserId)
    {
        if (!await musicService.GroupExistsAsync(groupId))
            return ApiResults.NotFound_404(QueryError.GroupNonExistentId);

        var kickedUser = await userService.GetUserByIdAsync(kickedUserId);
        if (kickedUser is null)
            return ApiResults.NotFound_404(QueryError.UserNonExistentId);

        if (!await mshipService.IsMemberAsync(kickedUserId, groupId))
            return ApiResults.UnprocessableEntity_422(QueryError.GroupNonExistentMember);

        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var higherAdminPrivilegeResult = await mshipService.HasHigherAdminPrivilegeAsync(queryUserId, kickedUserId, groupId);
        if (queryUserId != kickedUserId && higherAdminPrivilegeResult.HasFailed)
            return ApiResults.Forbidden_403(higherAdminPrivilegeResult.Error);

        // anyone can leave from a group if they decide to, apart from the creator: that's a deletion
        if (queryUserId == kickedUserId)
        {
            if (higherAdminPrivilegeResult.Value == RoleType.Creator)
                return ApiResults.UnprocessableEntity_422(QueryError.GroupCreatorLeaving);

            // changing the leaving user's selected group to their default one, if needed
            var queryUser = await userService.GetUserByIdAsync(queryUserId);
            if (queryUser!.SelectedGroupId == groupId)
                await userService.SetSelectedGroupAsync(queryUser, queryUser!.OwnGroupId, musicService);
        }
        else
        {
            // when an admin/creator kicks someone else, reset that user's selected group if it pointed at this group (don't leave it dangling)
            if (kickedUser.SelectedGroupId == groupId)
                await userService.SetSelectedGroupAsync(kickedUser, kickedUser.OwnGroupId, musicService);
        }

        await mshipService.DeleteGroupMembershipAsync(kickedUserId, groupId);
        return ApiResults.NoContent_204();
    }
}
