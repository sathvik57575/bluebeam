import { useInView} from "react-intersection-observer";

interface InfiniteScrollContainerProps extends React.PropsWithChildren {
  onBottomReached: () => void;
  className?: string;
}

export default function InfiniteScrollContainer({
  children,
  className,
  onBottomReached,
}: InfiniteScrollContainerProps) {

    const {ref} = useInView({
        rootMargin: "200px", //start loading new posts when the user is 200px away from the bottom of the container, we can adjust this value to load earlier or later
        onChange(InView){
            if(InView){
                onBottomReached();
            }
        }
    })

    return (
        <div className={className}>
            {children}
            <div ref={ref}/>
        </div>
    )
}
