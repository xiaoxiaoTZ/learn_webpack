// 大整数加法
export default function add(a,b){
    let i=a.length-1,
        j=b.length-1,
        carry=0,
        ret=''
    while(i>=0||j>=0){
        let n=0,m=0,temp=0;
        (i>=0)&&(n=+a[i--]);
        (j>=0)&&(m=+b[j--]);
        temp=n+m+carry;
        if(temp>=10){
            carry=1;
            temp=temp%10;
        }
        ret=temp+ret;
    }
    (carry==1)&&(ret='1'+ret)
    return ret;
}