import Link from 'next/link';
export default function Login(){return (<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
  <div className='max-w-md w-full'><div className='text-center mb-6'><Link href='/' className='text-2xl font-bold text-blue-600'>EduPlatform</Link><h2 className='text-xl font-bold mt-2'>Welcome back!</h2></div>
  <div className='bg-white p-6 rounded border'>
    <div className='mb-3 p-3 bg-blue-50 rounded text-sm'><b>Demo:</b> student@demo.com / demo123</div>
    <form className='space-y-4'><div><label className='block text-sm font-medium mb-1'>Email</label><input type='email' className='w-full p-2 border rounded' placeholder='Enter email' /></div><div><label className='block text-sm font-medium mb-1'>Password</label><input type='password' className='w-full p-2 border rounded' placeholder='Enter password' /></div><button className='w-full bg-blue-600 text-white py-2 rounded'>Sign In</button></form>
  </div></div></div>)}
