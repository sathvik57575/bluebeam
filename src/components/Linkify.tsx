import Link from "next/link";
import { LinkIt, LinkItUrl } from "react-linkify-it";
import UserLinkWithTooltip from "./UserLinkWithTooltip";

interface LinkifyProps {
  children: React.ReactNode;
}

export default function Linkify({ children }: LinkifyProps) {
  return (
    <LinkifyUserName>
      <LinkifyHashTags>
        <LinkifyUrl>{children}</LinkifyUrl>
      </LinkifyHashTags>
    </LinkifyUserName>
  );
}

function LinkifyUrl({ children }: LinkifyProps) {
  return (
    <LinkItUrl className="text-primary hover:underline">{children}</LinkItUrl>
  );
}

function LinkifyUserName({ children }: LinkifyProps) {
  return (
    <LinkIt
      regex={/(@[a-zA-Z0-9_-]+)/}
      component={(match, key) => (

        // previously it was this, then we built a new component to even handle showing tooltip on post text when someone writes @username

        // <Link
        //   key={key}
        //   href={`/users/${match.slice(1)}`}
        //   className="text-primary hover:underline"
        // >
        //   {match}
        // </Link>
        <UserLinkWithTooltip key={key} username={match.slice(1)}>
            {match}
        </UserLinkWithTooltip>
      )}
    >
      {children}
    </LinkIt>
  );
}

function LinkifyHashTags({ children }: LinkifyProps) {
  return (
    <LinkIt
      regex={/(#[a-zA-Z0-9]+)/}
      component={(match, key) => (
        <Link
          key={key}
          href={`/hashtags/${match.slice(1)}`}
          className="text-primary hover:underline"
        >
          {match}
        </Link>
      )}
    >{children}</LinkIt>
  );
}
