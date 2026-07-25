/* eslint-disable @typescript-eslint/no-explicit-any */
import { useChatContext } from "stream-chat-react";
import { useSession } from "../SessionProvider";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import useDebonuce from "@/hooks/useDebounce";
import { ChannelData, UserFilters, UserResponse } from "stream-chat";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Loader2, SearchIcon, X } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { toast } from "sonner";
import { LoadingButton } from "@/components/LoadingButton";

interface NewChatDialogProps {
  onOpenChange: (open: boolean) => void;
  onChatCreated: () => void;
}

export default function NewChatDialog({
  onChatCreated,
  onOpenChange,
}: NewChatDialogProps) {
  const { client, setActiveChannel } = useChatContext();

  const { user: loggedInUser } = useSession();

  const [searchInput, setSearchInput] = useState("");
  const searchInputDebounced = useDebonuce(searchInput);

  //since we can select multiple users we have to store them in an array
  const [selectedUsers, setSelectedUsers] = useState<UserResponse[]>([]);
  //in previous stream-chat-react versions we should do const [selectedUsers, setSelectedUsers] = useState<UserResponse<DefaultStreamChatGenerics>[]>([]);, but they removed defaultstreamchatgenerics from v13

  const { data, isFetching, isSuccess, isError } = useQuery({
    queryKey: ["stream-users", searchInputDebounced], //adding searchdebonuced here is important since every combination of letters we search for needs it's own cache, also queryfn doesn't run again unless querykey changes, so we need to include searchdebonuced as part of querykey to trigger a new search as input changes

    queryFn: async () => {
      const response = await client.queryUsers(
        {
          // id: { $ne : loggedInUser.id},
          // role: {$ne: "admin"},
          //commenting them out since ne and nin checks are not working

          ...(searchInputDebounced
            ? {
                $or: [
                  { name: { $autocomplete: searchInputDebounced } },
                  { username: { $autocomplete: searchInputDebounced } },
                ],
              }
            : {}),
        } as unknown as UserFilters,
        { name: 1, username: 1 },
        { limit: 15 },
      );

      return {
        ...response,
        users: response.users.filter(
          (u) => u.id !== loggedInUser.id && u.role !== "admin",
        ),
      };
      /*
      original response shape is
      {
        users: UserResponse[],
        duration: string  // Stream's internal API response timing, e.g. "0.50ms",  same field you saw in your error responses
      }
      */
    }
  });


  //mutation for starting a chat with selected users
  const mutation = useMutation({
    mutationFn: async () => {
      const channel = client.channel("messaging", {
        members: [loggedInUser.id, ...selectedUsers.map((u) => u.id)],
        name:
          selectedUsers.length > 1
            ? loggedInUser.displayName +
              ", " +
              selectedUsers.map((u) => u.name).join(", ")
            : undefined
      } as ChannelData);
      //using any type(and now ChannelData) here because of some custom channel name rules, explained in info8.txt file


      // await channel.create(); //commenting out create() and using watch(), reason explained in info8.txt file.
      await channel.watch();

      return channel;
    },

    onSuccess:(channel)=>{
      setActiveChannel(channel);
      onChatCreated() //remember to add this to close this dialog(and sidebar on small screens)
    },

    onError(error){
      console.log("Error starting chat", error);
      toast.error("Error starting chat. Please try again.")
    }
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="bg-card p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>New chat</DialogTitle>
        </DialogHeader>

        <div>
          <div className="group relative">
            <SearchIcon className="absolute left-5 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground group-focus-within:text-primary" />
            <input
              placeholder="Search users..."
              className="h-12 w-full pe-4 ps-14 focus:outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {!!selectedUsers.length && (
            <div className="mt-4 flex flex-wrap gap-2 p-2">
              {selectedUsers.map((user) => (
                <SelectedUser
                  key={user.id}
                  user={user}
                  onRemove={() => {
                    setSelectedUsers((prev) =>
                      prev.filter((u) => u.id !== user.id),
                    );
                  }}
                />
              ))}
            </div>
          )}

          <hr />

          <div className="h-96 overflow-y-auto">
            {isSuccess &&
              data.users.map((user) => (
                <UserResult
                  key={user.id}
                  user={user}
                  selected={selectedUsers.some((u) => u.id === user.id)}
                  onClick={
                    () => {
                      setSelectedUsers((prev) => {
                        if (prev.some((u) => u.id === user.id)) {
                          return prev.filter((u) => u.id !== user.id);
                        }
                        return [...prev, user];
                      });
                    }
                    /* or can do this
                      setSelectedUsers((prev) =>
                      prev.some((u) => u.id === user.id)
                        ? prev.filter((u) => u.id !== user.id)
                        : [...prev, user],
                    );
                    */
                  }
                />
              ))}

            {isSuccess && !data.users.length && (
              <p className="my-3 text-center text-muted-foreground">
                No users found. Try a different name.
              </p>
            )}

            {isFetching && <Loader2 className="mx-auto my-3 animate-spin" />}

            {isError && (
              <p className="my-3 text-center text-destructive">
                An error occurred while loading users.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 pb-6">
          <LoadingButton
            disabled={mutation.isPending}
            loading={!selectedUsers.length || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="cursor-pointer"
          >
            Start Chat
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

//for rendering user search results
interface UserResultProps {
  user: UserResponse;
  selected: boolean;
  onClick: () => void;
}

function UserResult({ onClick, selected, user }: UserResultProps) {
  return (
    <button
      className="flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/50 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <UserAvatar avatarUrl={user.image} />
        <div className="flex flex-col text-start">
          <p className="font-bold">{user.name}</p>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
      </div>

      {selected && <Check className="size-5 text-green-500" />}
    </button>
  );
}

//for showing selected user(individual)
interface selectedUserProps {
  user: UserResponse;
  onRemove: () => void;
}

function SelectedUser({ onRemove, user }: selectedUserProps) {
  return (
    <button
      onClick={onRemove}
      className="flex items-center gap-2 rounded-full border p-1 hover:bg-muted/50 cursor-pointer"
    >
      <UserAvatar avatarUrl={user.image} size={24} />
      <p className="font-bold">{user.name}</p>
      <X className="mx-2 size-5 text-muted-foreground" />
    </button>
  );
}